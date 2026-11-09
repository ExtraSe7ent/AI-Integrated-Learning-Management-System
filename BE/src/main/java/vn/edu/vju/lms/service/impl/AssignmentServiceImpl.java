package vn.edu.vju.lms.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AssessmentGrader;
import vn.edu.vju.lms.service.AssignmentService;
import vn.edu.vju.lms.wrapper.AssignmentWrapper;

@Service
public class AssignmentServiceImpl extends AbstractCrudService<Assignment, AssignmentWrapper> implements AssignmentService {

    private static final double TOTAL_POINTS = 10.0;
    private static final List<String> TYPES = List.of(ExamQuestion.CHOICE, ExamQuestion.BLANK, ExamQuestion.ESSAY);

    private final vn.edu.vju.lms.service.AssignmentPolicy policy;
    private final IAssignmentDao dao;
    private final IAssessmentDao assessmentDao;

    public AssignmentServiceImpl(IAssignmentDao dao, IAssessmentDao assessmentDao, vn.edu.vju.lms.service.AssignmentPolicy policy) {
        this.policy = policy;
        this.dao = dao;
        this.assessmentDao = assessmentDao;
    }

    @Override
    protected org.springframework.data.jpa.domain.Specification<Assignment> readScope() {
        var ids=dao.findAll().stream().filter(policy::canRead).map(Assignment::getId).toList();
        return (root, query, builder) -> root.get("id").in(ids);
    }
    @Override
    protected void checkRead(Assignment entity) { policy.requireRead(entity); }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public AssignmentWrapper get(String id) {
        Assignment a=locked(id);policy.requireRead(a);policy.refresh(a);return toWrapper(a);
    }
    @Override
    @org.springframework.transaction.annotation.Transactional
    public List<AssignmentWrapper> listAll() {
        return dao.findAll().stream().filter(policy::canRead).sorted(java.util.Comparator.comparing(Assignment::getId))
            .map(a -> { Assignment current=locked(a.getId());policy.refresh(current);return toWrapper(current); }).toList();
    }
    @Override
    @org.springframework.transaction.annotation.Transactional
    public vn.edu.vju.lms.common.web.PageResponse<AssignmentWrapper> search(String search,int page,int size,String sort) {
        var spec=new vn.edu.vju.lms.common.search.SpecificationsBuilder<Assignment>().parse(search).build().and(readScope());
        var found=dao.findAll(spec,vn.edu.vju.lms.common.web.PageRequests.of(page,size,sort));
        found.getContent().stream().sorted(java.util.Comparator.comparing(Assignment::getId))
            .forEach(a -> policy.refresh(locked(a.getId())));
        return vn.edu.vju.lms.common.web.PageResponse.of(found.map(this::toWrapper));
    }
    private Assignment locked(String id) {
        return dao.findForUpdate(id).orElseThrow(() -> new vn.edu.vju.lms.common.exception.ResourceNotFoundException(notFoundMessage()));
    }
    @Override
    @org.springframework.transaction.annotation.Transactional
    public AssignmentWrapper releaseAnswers(String id) {
        Assignment a=locked(id);policy.release(a);return toWrapper(a);
    }
    @Override
    @org.springframework.transaction.annotation.Transactional
    public AssignmentWrapper update(String id,AssignmentWrapper wrapper) {
        Assignment current=locked(id);policy.requireTeaching(current);
        boolean started=assessmentDao.findByAssignment(id).stream().anyMatch(r -> r.getDraftDeadline()!=null || r.getScore()!=null);
        if(started && ((wrapper.getClassId()!=null&&!wrapper.getClassId().equals(current.getClassId()))
            || (wrapper.getQuestions()!=null&&!wrapper.getQuestions().equals(AssessmentGrader.questionsOf(current)))
            || (wrapper.getMinutes()!=null&&!wrapper.getMinutes().equals(current.getMinutes()))
            || (wrapper.getRandom()!=null&&!wrapper.getRandom().equals(current.getRandom()))
            || (wrapper.getOpens()!=null&&!wrapper.getOpens().equals(current.getOpens()))
            || (wrapper.getCloses()!=null&&!wrapper.getCloses().equals(current.getCloses()))
            || Boolean.FALSE.equals(wrapper.getPublished()))) {
            throw new BusinessRuleException("Đã có sinh viên bắt đầu: không được đổi lớp, đề, thứ tự, thời gian hoặc ẩn bài.");
        }
        return super.update(id,wrapper);
    }
    @Override
    protected void checkDelete(Assignment a) {
        policy.requireTeaching(a);
        if(!assessmentDao.findByAssignment(a.getId()).isEmpty()) throw new BusinessRuleException("Không xóa bài tập đã có bài làm.");
    }

    @Override
    protected IGenericDao<String, Assignment> dao() {
        return dao;
    }

    @Override
    protected Assignment newEntity() {
        return new Assignment();
    }

    @Override
    protected AssignmentWrapper toWrapper(Assignment entity) {
        AssignmentWrapper wrapper = new AssignmentWrapper();
        wrapper.setId(entity.getId());
        wrapper.setClassId(entity.getClassId());
        wrapper.setAnswersReleased(Boolean.TRUE.equals(entity.getAnswersReleased()));
        wrapper.setStudentCount(policy.roster(entity).size());
        wrapper.setSubmittedCount((int)policy.roster(entity).stream().filter(id -> assessmentDao.find(id,entity.getId()).filter(r -> r.getScore()!=null).isPresent()).count());
        wrapper.setTitle(entity.getTitle());
        wrapper.setMinutes(entity.getMinutes());
        wrapper.setOpens(entity.getOpens());
        wrapper.setCloses(entity.getCloses());
        wrapper.setPublished(entity.getPublished());
        wrapper.setPreventPaste(entity.getPreventPaste());
        wrapper.setAttempts(entity.getAttempts());
        wrapper.setRandom(entity.getRandom());
        wrapper.setQuestions(visibleQuestions(entity));
        return wrapper;
    }

    /** Answer keys never reach a student before they have submitted. */
    private List<ExamQuestion> visibleQuestions(Assignment entity) {
        List<ExamQuestion> questions = AssessmentGrader.questionsOf(entity);
        if (!UserPrincipal.callerIsStudent()) {
            return questions;
        }
        boolean released=Boolean.TRUE.equals(entity.getAnswersReleased());
        List<ExamQuestion> shown = questions.stream().map(released ? ExamQuestion::forReview : ExamQuestion::withoutAnswer).toList();
        return vn.edu.vju.lms.service.ExamOrder.toStudent(shown,
                vn.edu.vju.lms.service.ExamOrder.of(entity, UserPrincipal.current().id()));
    }

    @Override
    protected void mapWrapperToEntity(AssignmentWrapper wrapper, Assignment entity) {
        if (wrapper.getClassId() != null) entity.setClassId(wrapper.getClassId());
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getMinutes() != null) {
            entity.setMinutes(wrapper.getMinutes());
        }
        if (wrapper.getOpens() != null) {
            entity.setOpens(wrapper.getOpens());
        }
        if (wrapper.getCloses() != null) {
            entity.setCloses(wrapper.getCloses());
        }
        if (wrapper.getPublished() != null) {
            entity.setPublished(wrapper.getPublished());
        }
        if (wrapper.getPreventPaste() != null) {
            entity.setPreventPaste(wrapper.getPreventPaste());
        }
        if (wrapper.getAttempts() != null) {
            entity.setAttempts(wrapper.getAttempts());
        }
        if (wrapper.getRandom() != null) {
            entity.setRandom(wrapper.getRandom());
        }
        if (wrapper.getQuestions() != null && !wrapper.getQuestions().equals(AssessmentGrader.questionsOf(entity))) {
            if (assessmentDao.findByAssignment(entity.getId()).stream().anyMatch(record -> record.getScore() != null)) {
                throw new BusinessRuleException("Đề đã có bài nộp nên không thể sửa câu hỏi.");
            }
            entity.setQuestions(wrapper.getQuestions());
        }
    }

    @Override
    protected String wrapperId(AssignmentWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Assignment entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy bài tập.";
    }

    @Override
    protected void beforeSave(Assignment entity) {
        if (!StringUtils.hasText(entity.getClassId())) throw new BusinessRuleException("Bài tập cần chọn lớp học phần.");
        policy.requireTeaching(entity);
        if (entity.getMinutes()==null || entity.getMinutes()<1 || entity.getMinutes()>1440) throw new BusinessRuleException("Thời gian làm bài từ 1 đến 1440 phút.");
        if (entity.getOpens()==null || entity.getCloses()==null) throw new BusinessRuleException("Thiếu thời gian mở/đóng bài tập.");
        try { java.time.LocalDateTime.parse(entity.getOpens()); java.time.LocalDateTime.parse(entity.getCloses()); } catch(java.time.format.DateTimeParseException e) { throw new BusinessRuleException("Thời gian bài tập không hợp lệ."); }
        entity.setAttempts(1);
        if (entity.getOpens() != null && entity.getCloses() != null && entity.getCloses().compareTo(entity.getOpens()) <= 0) {
            throw new BusinessRuleException("Thời điểm đóng phải sau thời điểm mở.");
        }
        if (entity.getQuestions() != null) {
            validate(entity.getQuestions());
        }
    }

    private void validate(List<ExamQuestion> questions) {
        if (questions.isEmpty()) {
            throw new BusinessRuleException("Đề cần ít nhất một câu hỏi.");
        }
        questions.forEach(this::validate);
        if (Math.abs(AssessmentGrader.total(questions.stream().map(ExamQuestion::getPoints).toList()) - TOTAL_POINTS) > 0.001) {
            throw new BusinessRuleException("Tổng điểm của đề phải bằng 10.");
        }
    }

    private void validate(ExamQuestion question) {
        if (!TYPES.contains(question.getType()) || !StringUtils.hasText(question.getText())
                || question.getPoints() == null || question.getPoints() <= 0) {
            throw new BusinessRuleException("Mỗi câu cần loại câu, nội dung và điểm lớn hơn 0.");
        }
        if (!question.isEssay() && !StringUtils.hasText(question.getCorrect())) {
            throw new BusinessRuleException("Câu trắc nghiệm và điền trống cần có đáp án.");
        }
        if (ExamQuestion.CHOICE.equals(question.getType())) {
            int options = question.getOptions() == null ? 0 : question.getOptions().size();
            if (options < 2 || !question.getCorrect().matches("\\d+") || Integer.parseInt(question.getCorrect()) >= options) {
                throw new BusinessRuleException("Câu trắc nghiệm cần ít nhất 2 lựa chọn và một đáp án hợp lệ.");
            }
        }
    }
}
