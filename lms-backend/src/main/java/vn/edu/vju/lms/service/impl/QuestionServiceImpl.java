package vn.edu.vju.lms.service.impl;

import java.util.HashSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.QuestionService;
import vn.edu.vju.lms.wrapper.QuestionWrapper;

/**
 * Pre-class quiz attached to one slide (UC-A01): a question, exactly four options A–D, the correct one and an
 * explanation. AI suggestions arrive unapproved and stay invisible to students until a lecturer approves them.
 */
@Service
public class QuestionServiceImpl extends AbstractCrudService<Question, QuestionWrapper> implements QuestionService {

    static final int OPTION_COUNT = 4;
    static final int TEXT_MAX = 1000;
    static final int IMPORT_MAX = 500;

    private final IQuestionDao dao;
    private final TeachingScope scope;
    private final vn.edu.vju.lms.dao.IStudyProgressDao progressDao;

    public QuestionServiceImpl(IQuestionDao dao, TeachingScope scope, vn.edu.vju.lms.dao.IStudyProgressDao progressDao) {
        this.dao = dao;
        this.scope = scope;
        this.progressDao = progressDao;
    }

    /** UC-B03: a student only learns the key and explanation of a quiz after answering it on the server. */
    private QuestionWrapper forStudent(Question question, java.util.Set<String> answered) {
        QuestionWrapper wrapper = toWrapper(question);
        if (!answered.contains(question.getId())) {
            wrapper.setCorrect(null);
            wrapper.setExplanation(null);
        }
        return wrapper;
    }

    private java.util.Set<String> answeredBy(String studentId) {
        java.util.Set<String> answered = new java.util.HashSet<>();
        progressDao.findByStudent(studentId).forEach(p -> {
            if (p.getAnswers() != null) {
                answered.addAll(p.getAnswers().keySet());
            }
        });
        return answered;
    }

    @Override
    protected IGenericDao<String, Question> dao() {
        return dao;
    }

    @Override
    protected Question newEntity() {
        return new Question();
    }

    @Override
    protected QuestionWrapper toWrapper(Question entity) {
        QuestionWrapper wrapper = new QuestionWrapper();
        wrapper.setId(entity.getId());
        wrapper.setText(entity.getText());
        wrapper.setOptions(entity.getOptions());
        wrapper.setCorrect(entity.getCorrect());
        wrapper.setExplanation(entity.getExplanation());
        wrapper.setPage(entity.getPage());
        wrapper.setApproved(entity.getApproved());
        wrapper.setLessonId(TeachingScope.lessonOr(entity.getLessonId()));
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(QuestionWrapper wrapper, Question entity) {
        if (wrapper.getText() != null) {
            entity.setText(wrapper.getText().trim());
        }
        if (wrapper.getOptions() != null) {
            entity.setOptions(wrapper.getOptions().stream().map(o -> o == null ? "" : o.trim()).toList());
        }
        if (wrapper.getCorrect() != null) {
            entity.setCorrect(wrapper.getCorrect());
        }
        if (wrapper.getExplanation() != null) {
            entity.setExplanation(wrapper.getExplanation().trim());
        }
        if (wrapper.getPage() != null) {
            entity.setPage(wrapper.getPage());
        }
        if (wrapper.getApproved() != null) {
            entity.setApproved(wrapper.getApproved());
        }
        if (wrapper.getLessonId() != null) {
            entity.setLessonId(wrapper.getLessonId().trim());
        }
    }

    @Override
    protected String wrapperId(QuestionWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Question entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy câu hỏi.";
    }

    @Override
    protected void beforeCreate(QuestionWrapper wrapper, Question entity) {
        if (!StringUtils.hasText(entity.getLessonId())) {
            entity.setLessonId(TeachingScope.DEFAULT_LESSON);
        }
        if (entity.getApproved() == null) {
            entity.setApproved(false);
        }
    }

    @Override
    protected void beforeSave(Question entity) {
        if (!StringUtils.hasText(entity.getText()) || entity.getText().length() > TEXT_MAX) {
            throw new BusinessRuleException("Nội dung câu hỏi bắt buộc và tối đa " + TEXT_MAX + " ký tự.");
        }
        List<String> options = entity.getOptions();
        if (options == null || options.size() != OPTION_COUNT || options.stream().anyMatch(o -> !StringUtils.hasText(o))) {
            throw new BusinessRuleException("Câu trắc nghiệm cần đúng 4 lựa chọn A, B, C, D và không để trống.");
        }
        if (new HashSet<>(options.stream().map(String::toLowerCase).toList()).size() != OPTION_COUNT) {
            throw new BusinessRuleException("Các lựa chọn của câu hỏi không được trùng nhau.");
        }
        if (entity.getCorrect() == null || entity.getCorrect() < 0 || entity.getCorrect() >= options.size()) {
            throw new BusinessRuleException("Đáp án đúng không nằm trong danh sách lựa chọn.");
        }
        Lesson lesson = scope.requireLesson(entity.getLessonId());
        int pages = lesson.getSlides() == null || lesson.getSlides().isEmpty() ? Integer.MAX_VALUE : lesson.getSlides().size();
        if (entity.getPage() == null || entity.getPage() < 1 || entity.getPage() > pages) {
            throw new BusinessRuleException("Trang gắn câu hỏi phải từ 1 đến " + (pages == Integer.MAX_VALUE ? "số trang của bài" : pages) + ".");
        }
    }

    @Override
    @Transactional
    public QuestionWrapper update(String id, QuestionWrapper wrapper) {
        scope.requireLesson(require(id).getLessonId());
        return super.update(id, wrapper);
    }

    /** An answered question keeps the students' results meaningful, so it can be edited but not removed. */
    @Override
    protected void checkDelete(Question entity) {
        scope.requireLesson(entity.getLessonId());
        if (scope.questionAnswered(entity.getId())) {
            throw new BusinessRuleException("Câu hỏi đã có sinh viên trả lời, không thể xóa. Hãy sửa nội dung nếu cần.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionWrapper> listAll() {
        if (!UserPrincipal.callerIsStudent()) {
            return dao.findAll().stream().map(this::toWrapper).toList();
        }
        java.util.Set<String> answered = answeredBy(UserPrincipal.current().id());
        return dao.findAll().stream().filter(q -> Boolean.TRUE.equals(q.getApproved()))
                .map(q -> forStudent(q, answered)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionWrapper get(String id) {
        Question question = require(id);
        if (UserPrincipal.callerIsStudent()) {
            if (!Boolean.TRUE.equals(question.getApproved())) {
                throw new ResourceNotFoundException(notFoundMessage());
            }
            return forStudent(question, answeredBy(UserPrincipal.current().id()));
        }
        return toWrapper(question);
    }

    @Override
    @Transactional
    public List<QuestionWrapper> importQuestions(List<QuestionWrapper> rows) {
        if (rows == null || rows.isEmpty()) {
            throw new BusinessRuleException("Tệp không có câu hỏi nào.");
        }
        if (rows.size() > IMPORT_MAX) {
            throw new BusinessRuleException("Mỗi lần nhập tối đa " + IMPORT_MAX + " câu hỏi.");
        }
        int[] line = {0};
        return rows.stream().map(row -> {
            line[0]++;
            try {
                return create(row);
            } catch (BusinessRuleException e) {
                throw new BusinessRuleException("Dòng " + line[0] + ": " + e.getMessage());
            }
        }).toList();
    }
}
