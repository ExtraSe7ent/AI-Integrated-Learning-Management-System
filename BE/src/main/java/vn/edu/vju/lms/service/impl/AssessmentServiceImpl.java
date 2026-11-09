package vn.edu.vju.lms.service.impl;

import vn.edu.vju.lms.service.ExamOrder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.ai.EssayGrader;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IAppealDao;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.Assessment;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AssessmentGrader;
import vn.edu.vju.lms.service.AssessmentService;
import vn.edu.vju.lms.wrapper.AssessmentWrapper;

@Service
public class AssessmentServiceImpl implements AssessmentService {

    private static final String WAIT_FOR_APPEAL = "Chờ xử lý phúc khảo trước khi làm lại bài tập.";

    private final vn.edu.vju.lms.service.AssignmentPolicy policy;
    private final IAssessmentDao assessmentDao;
    private final IAssignmentDao assignmentDao;
    private final IAppealDao appealDao;
    private final IUserAccountDao userDao;
    private final EssayGrader essayGrader;
    private final ZoneId zone;

    public AssessmentServiceImpl(IAssessmentDao assessmentDao, IAssignmentDao assignmentDao, IAppealDao appealDao,
            IUserAccountDao userDao, EssayGrader essayGrader, LmsProperties properties, vn.edu.vju.lms.service.AssignmentPolicy policy) {
        this.policy = policy;
        this.assessmentDao = assessmentDao;
        this.assignmentDao = assignmentDao;
        this.appealDao = appealDao;
        this.userDao = userDao;
        this.essayGrader = essayGrader;
        this.zone = ZoneId.of(properties.getTimeZone());
    }

    @Override
    @Transactional
    public Map<String, AssessmentWrapper> visibleToCurrentUser() {
        UserPrincipal user = UserPrincipal.current();
        assignmentDao.findAll().stream().filter(policy::canRead).sorted(java.util.Comparator.comparing(Assignment::getId))
            .forEach(a -> policy.refresh(requireAssignment(a.getId())));
        List<Assessment> records = user.isStudent() ? assessmentDao.findByStudent(user.id()) : assessmentDao.findSubmitted();
        Map<String, AssessmentWrapper> result = new LinkedHashMap<>();
        records.forEach(record -> {
            assignmentDao.findById(record.getAssignmentId()).filter(policy::canRead).ifPresent(assignment -> {
                finalizeExpired(record, assignment);
                result.put(record.getAssignmentId(), toWrapper(record));
            });
        });
        return result;
    }

    @Override
    @Transactional
    public AssessmentWrapper save(String assignmentId, AssessmentWrapper wrapper) {
        UserPrincipal user = UserPrincipal.current();
        Assignment assignment = requireAssignment(assignmentId);
        policy.requireRead(assignment);
        if (user.isStudent()) {
            Assessment saved=saveStudentWork(user.id(), assignment, wrapper);
            policy.refresh(assignment);
            return toWrapper(saved);
        }
        policy.refresh(assignment);
        if (user.role() != Role.LECTURER && user.role() != Role.ADMIN) {
            throw new ForbiddenOperationException("Bạn không có quyền chấm bài.");
        }
        policy.requireTeaching(assignment);
        return toWrapper(grade(assignment, wrapper));
    }

    @Override
    @Transactional
    public List<AssessmentWrapper> submissions(String assignmentId) {
        Assignment assignment = requireAssignment(assignmentId);
        policy.requireTeaching(assignment);
        policy.refresh(assignment);
        List<Assessment> records = assessmentDao.findByAssignment(assignmentId);
        records.forEach(record -> finalizeExpired(record, assignment));
        return records.stream().filter(record -> record.getScore() != null).map(record -> {
            AssessmentWrapper wrapper = toWrapper(record);
            wrapper.setStudentName(userDao.findById(record.getStudentId()).map(UserAccount::getName).orElse(record.getStudentId()));
            return wrapper;
        }).toList();
    }

    /** Not transactional: a model call can take a minute and must not hold a database connection. */
    @Override
    public List<EssayGrader.Draft> essayDrafts(String assignmentId, String studentId) {
        Assignment assignment = assignmentDao.findById(assignmentId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập."));
        policy.requireTeaching(assignment);
        List<String> answers = submission(studentId, assignmentId).getAnswers();
        List<ExamQuestion> questions = AssessmentGrader.questionsOf(assignment);
        List<EssayGrader.Draft> drafts = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            if (questions.get(i).isEssay()) {
                drafts.add(essayGrader.draft(i, questions.get(i), i < answers.size() ? answers.get(i) : ""));
            }
        }
        return drafts;
    }

    @Override
    @Transactional
    public void regrade(String studentId, String assignmentId, int questionIndex, double points) {
        Assignment assignment = requireAssignment(assignmentId);
        policy.requireTeaching(assignment);
        Assessment record = submission(studentId, assignmentId);
        List<Double> updated = new ArrayList<>(record.getQuestionPoints());
        if (questionIndex < 0 || questionIndex >= updated.size()) {
            throw new BusinessRuleException("Điểm câu không hợp lệ.");
        }
        updated.set(questionIndex, points);
        record.setQuestionPoints(validPoints(requireAssignment(assignmentId), updated));
        record.setScore(AssessmentGrader.total(updated));
        record.setApproved(true);
    }

    private Assignment requireAssignment(String assignmentId) {
        return assignmentDao.findForUpdate(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập."));
    }

    private Assessment submission(String studentId, String assignmentId) {
        return assessmentDao.find(studentId, assignmentId).filter(record -> record.getScore() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có bài nộp để chấm."));
    }

    private Assessment saveStudentWork(String studentId, Assignment assignment, AssessmentWrapper wrapper) {
        Assessment record = assessmentDao.find(studentId, assignment.getId()).orElseGet(() -> create(studentId, assignment.getId()));
        if (record.getScore()==null && hasPendingAppeal(studentId, assignment.getId())) {
            throw new BusinessRuleException(WAIT_FOR_APPEAL);
        }
        if (finalizeExpired(record, assignment)) {
            return record;
        }
        if (wrapper.getDraft() != null) {
            if(record.getScore()!=null && !Boolean.TRUE.equals(assignment.getAnswersReleased())) throw new BusinessRuleException("Chờ công bố đáp án để luyện tập. Lượt tính điểm đã hoàn tất.");
            saveDraft(record, assignment, wrapper.getDraft());
        } else if (wrapper.getResult() != null && record.getDraftDeadline() != null) {
            submit(record, assignment, wrapper.getResult().getAnswers());
        }
        return record;
    }

    private void saveDraft(Assessment record, Assignment assignment, AssessmentWrapper.Draft draft) {
        if (record.getDraftDeadline() == null) {
            long now = Instant.now().toEpochMilli();
            long closes = epochMillis(assignment.getCloses());
            boolean practice=record.getScore()!=null && Boolean.TRUE.equals(assignment.getAnswersReleased());
            if (!practice && (!Boolean.TRUE.equals(assignment.getPublished()) || now < epochMillis(assignment.getOpens()) || now >= closes)) {
                throw new BusinessRuleException("Bài tập chưa mở hoặc đã đóng.");
            }
            if (!practice && record.getScore()!=null) {
                throw new BusinessRuleException("Đã hết lượt làm bài.");
            }
            record.setDraftDeadline(practice ? now + assignment.getMinutes()*60_000L : Math.min(now + assignment.getMinutes() * 60_000L, closes));
        }
        // The student answers in their own question order; work is stored in the assignment's order.
        record.setDraftAnswers(ExamOrder.toOriginal(draft.getAnswers(), ExamOrder.of(assignment, record.getStudentId())));
    }

    private void submit(Assessment record, Assignment assignment, List<String> answers) {
        List<String> submitted = answers == null ? List.of()
                : ExamOrder.toOriginal(answers, ExamOrder.of(assignment, record.getStudentId()));
        finishSubmission(record, assignment, submitted);
    }

    private boolean finalizeExpired(Assessment record, Assignment assignment) {
        if (record.getDraftDeadline() == null || Instant.now().toEpochMilli() < record.getDraftDeadline()) {
            return false;
        }
        // Saved answers are already in the assignment's canonical order.
        finishSubmission(record, assignment, record.getDraftAnswers() == null ? List.of() : record.getDraftAnswers());
        return true;
    }

    private void finishSubmission(Assessment record, Assignment assignment, List<String> submitted) {
        if(record.getScore()==null) {
            policy.finishOfficial(record,assignment,submitted);
            policy.refresh(assignment);
            return;
        }
        if(!Boolean.TRUE.equals(assignment.getAnswersReleased())) throw new BusinessRuleException("Chưa công bố đáp án.");
        var practice = new vn.edu.vju.lms.entity.PracticeAttempt();
        practice.setAnswers(new ArrayList<>(submitted));
        practice.setQuestionPoints(AssessmentGrader.grade(AssessmentGrader.questionsOf(assignment),submitted));
        practice.setScore(AssessmentGrader.total(practice.getQuestionPoints()));
        practice.setSubmitted(policy.timestamp());
        var history=new ArrayList<>(record.getPracticeResults()==null?List.<vn.edu.vju.lms.entity.PracticeAttempt>of():record.getPracticeResults());
        history.add(practice);record.setPracticeResults(history);
        record.setDraftAnswers(null);record.setDraftDeadline(null);
    }

    private Assessment grade(Assignment assignment, AssessmentWrapper wrapper) {
        String assignmentId = assignment.getId();
        Assessment record = (StringUtils.hasText(wrapper.getStudentId())
                ? assessmentDao.find(wrapper.getStudentId(), assignmentId)
                : assessmentDao.findSubmitted().stream().filter(a -> assignmentId.equals(a.getAssignmentId())).findFirst())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có bài nộp để chấm."));
        AssessmentWrapper.Result result = wrapper.getResult();
        if (result == null) {
            return record;
        }
        if (result.getQuestionPoints() != null) {
            record.setQuestionPoints(validPoints(assignment, result.getQuestionPoints()));
            record.setScore(AssessmentGrader.total(record.getQuestionPoints()));
        }
        if (result.getApproved() != null) {
            record.setApproved(result.getApproved());
        }
        if (result.getComment() != null) {
            record.setComment(result.getComment());
        }
        return record;
    }

    private List<Double> validPoints(Assignment assignment, List<Double> points) {
        List<ExamQuestion> questions = AssessmentGrader.questionsOf(assignment);
        if (points.size() != questions.size()) {
            throw new BusinessRuleException("Điểm câu không hợp lệ.");
        }
        for (int i = 0; i < points.size(); i++) {
            Double value = points.get(i);
            if (value == null || value < 0 || value > questions.get(i).getPoints()) {
                throw new BusinessRuleException("Điểm câu không hợp lệ.");
            }
        }
        return new ArrayList<>(points);
    }

    private boolean hasPendingAppeal(String studentId, String assignmentId) {
        return appealDao.findAll().stream().anyMatch(appeal -> studentId.equals(appeal.getOwnerId())
                && assignmentId.equals(appeal.getAssignmentId()) && "pending".equals(appeal.getStatus()));
    }

    private Assessment create(String studentId, String assignmentId) {
        Assessment record = new Assessment();
        record.setId(studentId + ":" + assignmentId);
        record.setStudentId(studentId);
        record.setAssignmentId(assignmentId);
        return assessmentDao.persist(record);
    }

    private long epochMillis(String localDateTime) {
        return LocalDateTime.parse(localDateTime).atZone(zone).toInstant().toEpochMilli();
    }

    private AssessmentWrapper toWrapper(Assessment record) {
        AssessmentWrapper wrapper = canonicalWrapper(record);
        var assignment=assignmentDao.findById(record.getAssignmentId()).orElse(null);
        var practiceResults=new ArrayList<AssessmentWrapper.Result>();
        for(var p:record.getPracticeResults()==null?List.<vn.edu.vju.lms.entity.PracticeAttempt>of():record.getPracticeResults()) {
            var r=new AssessmentWrapper.Result();r.setAnswers(p.getAnswers());r.setQuestionPoints(p.getQuestionPoints());r.setScore(p.getScore());r.setSubmitted(p.getSubmitted());practiceResults.add(r);
        }
        wrapper.setPracticeResults(practiceResults);
        if(wrapper.getDraft()!=null) wrapper.getDraft().setMode(record.getScore()==null?"official":"practice");
        if(UserPrincipal.callerIsStudent() && (assignment==null || !Boolean.TRUE.equals(assignment.getAnswersReleased())) && wrapper.getResult()!=null) {
            wrapper.getResult().setQuestionPoints(null);wrapper.getResult().setAiFeedback(null);wrapper.getResult().setComment(null);
        }
        if (!UserPrincipal.callerIsStudent()) {
            return wrapper;
        }
        int[] order = assignmentDao.findById(record.getAssignmentId())
                .map(a -> ExamOrder.of(a, record.getStudentId())).orElse(new int[0]);
        if (wrapper.getDraft() != null) {
            wrapper.getDraft().setAnswers(ExamOrder.toStudent(wrapper.getDraft().getAnswers(), order));
        }
        if (wrapper.getResult() != null) {
            wrapper.getResult().setAnswers(ExamOrder.toStudent(wrapper.getResult().getAnswers(), order));
            wrapper.getResult().setQuestionPoints(ExamOrder.toStudent(wrapper.getResult().getQuestionPoints(), order));
            wrapper.getResult().setAiFeedback(ExamOrder.toStudent(wrapper.getResult().getAiFeedback(), order));
        }
        for(var r:wrapper.getPracticeResults()) {
            r.setAnswers(ExamOrder.toStudent(r.getAnswers(),order));
            r.setQuestionPoints(ExamOrder.toStudent(r.getQuestionPoints(),order));
        }
        return wrapper;
    }

    private AssessmentWrapper canonicalWrapper(Assessment record) {
        AssessmentWrapper wrapper = new AssessmentWrapper();
        wrapper.setStudentId(record.getStudentId());
        wrapper.setAttempts(record.getAttempts());
        if (record.getDraftDeadline() != null) {
            AssessmentWrapper.Draft draft = new AssessmentWrapper.Draft();
            draft.setAnswers(record.getDraftAnswers());
            draft.setDeadline(record.getDraftDeadline());
            wrapper.setDraft(draft);
        }
        if (record.getScore() != null) {
            AssessmentWrapper.Result result = new AssessmentWrapper.Result();
            result.setScore(record.getScore());
            result.setQuestionPoints(record.getQuestionPoints());
            result.setAnswers(record.getAnswers());
            result.setSubmitted(record.getSubmitted());
            result.setApproved(record.getApproved());
            result.setComment(record.getComment());
            result.setAiFeedback(record.getAiFeedback());
            wrapper.setResult(result);
        }
        return wrapper;
    }
}
