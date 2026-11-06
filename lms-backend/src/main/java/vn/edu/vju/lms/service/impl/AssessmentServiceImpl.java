package vn.edu.vju.lms.service.impl;

import vn.edu.vju.lms.service.ExamOrder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.ai.EssayGrader;
import vn.edu.vju.lms.ai.EssayGradingJob;
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
    private static final DateTimeFormatter SUBMITTED = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    private final IAssessmentDao assessmentDao;
    private final IAssignmentDao assignmentDao;
    private final IAppealDao appealDao;
    private final IUserAccountDao userDao;
    private final EssayGrader essayGrader;
    private final ApplicationEventPublisher events;
    private final ZoneId zone;

    public AssessmentServiceImpl(IAssessmentDao assessmentDao, IAssignmentDao assignmentDao, IAppealDao appealDao,
            IUserAccountDao userDao, EssayGrader essayGrader, ApplicationEventPublisher events, LmsProperties properties) {
        this.assessmentDao = assessmentDao;
        this.assignmentDao = assignmentDao;
        this.appealDao = appealDao;
        this.userDao = userDao;
        this.essayGrader = essayGrader;
        this.events = events;
        this.zone = ZoneId.of(properties.getTimeZone());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, AssessmentWrapper> visibleToCurrentUser() {
        UserPrincipal user = UserPrincipal.current();
        List<Assessment> records = user.isStudent() ? assessmentDao.findByStudent(user.id()) : assessmentDao.findSubmitted();
        Map<String, AssessmentWrapper> result = new LinkedHashMap<>();
        records.forEach(record -> result.put(record.getAssignmentId(), toWrapper(record)));
        return result;
    }

    @Override
    @Transactional
    public AssessmentWrapper save(String assignmentId, AssessmentWrapper wrapper) {
        UserPrincipal user = UserPrincipal.current();
        Assignment assignment = requireAssignment(assignmentId);
        if (user.isStudent()) {
            return toWrapper(saveStudentWork(user.id(), assignment, wrapper));
        }
        if (user.role() != Role.LECTURER && user.role() != Role.ADMIN) {
            throw new ForbiddenOperationException("Bạn không có quyền chấm bài.");
        }
        return toWrapper(grade(assignment, wrapper));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssessmentWrapper> submissions(String assignmentId) {
        return assessmentDao.findByAssignment(assignmentId).stream().filter(record -> record.getScore() != null).map(record -> {
            AssessmentWrapper wrapper = toWrapper(record);
            wrapper.setStudentName(userDao.findById(record.getStudentId()).map(UserAccount::getName).orElse(record.getStudentId()));
            return wrapper;
        }).toList();
    }

    /** Not transactional: a model call can take a minute and must not hold a database connection. */
    @Override
    public List<EssayGrader.Draft> essayDrafts(String assignmentId, String studentId) {
        Assignment assignment = requireAssignment(assignmentId);
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
        return assignmentDao.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập."));
    }

    private Assessment submission(String studentId, String assignmentId) {
        return assessmentDao.find(studentId, assignmentId).filter(record -> record.getScore() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có bài nộp để chấm."));
    }

    private Assessment saveStudentWork(String studentId, Assignment assignment, AssessmentWrapper wrapper) {
        Assessment record = assessmentDao.find(studentId, assignment.getId()).orElseGet(() -> create(studentId, assignment.getId()));
        if (hasPendingAppeal(studentId, assignment.getId())) {
            throw new BusinessRuleException(WAIT_FOR_APPEAL);
        }
        if (wrapper.getDraft() != null) {
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
            if (!Boolean.TRUE.equals(assignment.getPublished()) || now < epochMillis(assignment.getOpens()) || now >= closes) {
                throw new BusinessRuleException("Bài tập chưa mở hoặc đã đóng.");
            }
            if (record.getAttempts() >= assignment.getAttempts()) {
                throw new BusinessRuleException("Đã hết lượt làm bài.");
            }
            record.setDraftDeadline(Math.min(now + assignment.getMinutes() * 60_000L, closes));
        }
        // The student answers in their own question order; work is stored in the assignment's order.
        record.setDraftAnswers(ExamOrder.toOriginal(draft.getAnswers(), ExamOrder.of(assignment, record.getStudentId())));
    }

    private void submit(Assessment record, Assignment assignment, List<String> answers) {
        if (record.getAttempts() >= assignment.getAttempts()) {
            throw new BusinessRuleException("Cần bắt đầu lượt làm hợp lệ trước khi nộp.");
        }
        List<String> submitted = answers == null ? List.of()
                : ExamOrder.toOriginal(answers, ExamOrder.of(assignment, record.getStudentId()));
        List<Double> points = AssessmentGrader.grade(AssessmentGrader.questionsOf(assignment), submitted);
        record.setAnswers(new ArrayList<>(submitted));
        record.setQuestionPoints(points);
        record.setScore(AssessmentGrader.total(points));
        record.setSubmitted(LocalDateTime.now(zone).format(SUBMITTED));
        record.setApproved(null);
        record.setComment(null);
        record.setDraftAnswers(null);
        record.setDraftDeadline(null);
        record.setAiFeedback(null);
        record.setAttempts(record.getAttempts() + 1);
        events.publishEvent(new EssayGradingJob.Submitted(record.getStudentId(), record.getAssignmentId()));
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
        if (!UserPrincipal.callerIsStudent()) {
            return wrapper;
        }
        int[] order = assignmentDao.findById(record.getAssignmentId())
                .map(assignment -> ExamOrder.of(assignment, record.getStudentId())).orElse(new int[0]);
        if (wrapper.getDraft() != null) {
            wrapper.getDraft().setAnswers(ExamOrder.toStudent(wrapper.getDraft().getAnswers(), order));
        }
        if (wrapper.getResult() != null) {
            wrapper.getResult().setAnswers(ExamOrder.toStudent(wrapper.getResult().getAnswers(), order));
            wrapper.getResult().setQuestionPoints(ExamOrder.toStudent(wrapper.getResult().getQuestionPoints(), order));
            wrapper.getResult().setAiFeedback(ExamOrder.toStudent(wrapper.getResult().getAiFeedback(), order));
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
