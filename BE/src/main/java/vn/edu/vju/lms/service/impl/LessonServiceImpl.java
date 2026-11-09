package vn.edu.vju.lms.service.impl;

import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.service.LessonService;
import vn.edu.vju.lms.wrapper.LessonWrapper;

/**
 * UC-G02 and the lesson side of UC-A01. "Has student data" is decided here, never taken from the client, and
 * protects a lesson from deletion. Publishing needs every quiz of the lesson approved.
 */
@Service
public class LessonServiceImpl extends AbstractCrudService<Lesson, LessonWrapper> implements LessonService {

    static final int TITLE_MAX = 120;
    static final int SLIDES_MAX = 200;
    static final int WEEK_MAX = 20;
    private static final Pattern YOUTUBE = Pattern.compile("^https://(www\\.|m\\.)?(youtube\\.com/(watch\\?v=|embed/|shorts/)|youtu\\.be/)[\\w-]{6,}.*$");

    private final ILessonDao dao;
    private final IQuestionDao questionDao;
    private final IStudySessionDao sessionDao;
    private final TeachingScope scope;

    public LessonServiceImpl(ILessonDao dao, IQuestionDao questionDao, IStudySessionDao sessionDao, TeachingScope scope) {
        this.dao = dao;
        this.questionDao = questionDao;
        this.sessionDao = sessionDao;
        this.scope = scope;
    }

    @Override
    protected org.springframework.data.jpa.domain.Specification<Lesson> readScope() {
        var ids = scope.readableLessonIds();
        return (root, query, builder) -> root.get("id").in(ids);
    }

    @Override
    protected void checkRead(Lesson entity) {
        scope.requireReadLesson(entity.getId());
    }

    @Override
    protected IGenericDao<String, Lesson> dao() {
        return dao;
    }

    @Override
    protected Lesson newEntity() {
        return new Lesson();
    }

    @Override
    protected LessonWrapper toWrapper(Lesson entity) {
        LessonWrapper wrapper = new LessonWrapper();
        wrapper.setId(entity.getId());
        wrapper.setClassId(TeachingScope.classOf(entity));
        wrapper.setTitle(entity.getTitle());
        wrapper.setOrder(entity.getOrder());
        wrapper.setPublished(entity.getPublished());
        wrapper.setActivity(Boolean.TRUE.equals(entity.getActivity()) || scope.hasStudentData(entity.getId()));
        wrapper.setSlides(entity.getSlides());
        wrapper.setVideo(entity.getVideo());
        wrapper.setWeek(entity.getWeek());
        wrapper.setMaterialId(entity.getMaterialId());
        wrapper.setPdfName(entity.getPdfName());
        return wrapper;
    }

    /** activity is computed by the server, so it is never copied from the request. */
    @Override
    protected void mapWrapperToEntity(LessonWrapper wrapper, Lesson entity) {
        if (wrapper.getClassId() != null) {
            entity.setClassId(wrapper.getClassId().trim());
        }
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle().trim());
        }
        if (wrapper.getOrder() != null) {
            entity.setOrder(wrapper.getOrder());
        }
        if (wrapper.getPublished() != null) {
            entity.setPublished(wrapper.getPublished());
        }
        if (wrapper.getSlides() != null) {
            entity.setSlides(wrapper.getSlides().stream().map(String::trim).toList());
        }
        if (wrapper.getVideo() != null) {
            entity.setVideo(wrapper.getVideo().trim());
        }
        if (wrapper.getWeek() != null) {
            entity.setWeek(wrapper.getWeek());
        }
        if (wrapper.getMaterialId() != null) {
            entity.setMaterialId(StringUtils.hasText(wrapper.getMaterialId()) ? wrapper.getMaterialId().trim() : null);
            entity.setPdfName(StringUtils.hasText(wrapper.getPdfName()) ? wrapper.getPdfName().trim() : null);
        }
    }

    @Override
    protected String wrapperId(LessonWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Lesson entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy bài học.";
    }

    @Override
    protected void beforeCreate(LessonWrapper wrapper, Lesson entity) {
        if (!StringUtils.hasText(entity.getClassId())) {
            entity.setClassId(TeachingScope.DEFAULT_CLASS);
        }
        if (entity.getOrder() == null) {
            entity.setOrder((int) dao.count() + 1);
        }
        entity.setActivity(false);
        if (entity.getPublished() == null) {
            entity.setPublished(false);
        }
    }

    @Override
    protected void beforeSave(Lesson entity) {
        if (!StringUtils.hasText(entity.getTitle()) || entity.getTitle().length() > TITLE_MAX) {
            throw new BusinessRuleException("Tên bài học bắt buộc và tối đa " + TITLE_MAX + " ký tự.");
        }
        if (entity.getWeek() != null && (entity.getWeek() < 1 || entity.getWeek() > WEEK_MAX)) {
            throw new BusinessRuleException("Tuần học phải từ 1 đến " + WEEK_MAX + ".");
        }
        if (entity.getOrder() != null && entity.getOrder() < 1) {
            throw new BusinessRuleException("Thứ tự bài học phải từ 1.");
        }
        List<String> slides = entity.getSlides();
        if (slides != null && (slides.size() > SLIDES_MAX || slides.stream().anyMatch(s -> !StringUtils.hasText(s)))) {
            throw new BusinessRuleException("Mỗi trang bài giảng cần có tên; tối đa " + SLIDES_MAX + " trang.");
        }
        if (StringUtils.hasText(entity.getVideo()) && !YOUTUBE.matcher(entity.getVideo()).matches()) {
            throw new BusinessRuleException("Video phải là liên kết YouTube hợp lệ (https://www.youtube.com/watch?v=… hoặc https://youtu.be/…).");
        }
        scope.requireClass(TeachingScope.classOf(entity));
    }

    @Override
    @Transactional
    public LessonWrapper update(String id, LessonWrapper wrapper) {
        Lesson current = require(id);
        // The lesson's current class must be the caller's too, so content cannot be moved out of another class.
        scope.requireClass(TeachingScope.classOf(current));
        boolean publishing = !Boolean.TRUE.equals(current.getPublished()) && Boolean.TRUE.equals(wrapper.getPublished());
        if (publishing) {
            long pending = questionDao.findAll().stream()
                    .filter(q -> id.equals(TeachingScope.lessonOr(q.getLessonId())) && !Boolean.TRUE.equals(q.getApproved()))
                    .count();
            if (pending > 0) {
                throw new BusinessRuleException("Cần duyệt " + pending + " câu hỏi chờ duyệt trước khi công bố bài học.");
            }
        }
        return super.update(id, wrapper);
    }

    /** A lesson nobody studied yet is removed with its quizzes and sessions, so no orphan is left behind. */
    @Override
    protected void checkDelete(Lesson entity) {
        scope.requireClass(TeachingScope.classOf(entity));
        if (Boolean.TRUE.equals(entity.getActivity()) || scope.hasStudentData(entity.getId())) {
            throw new BusinessRuleException("Không thể xóa bài học đã có dữ liệu sinh viên.");
        }
        String id = entity.getId();
        questionDao.findAll().stream().filter(q -> id.equals(q.getLessonId())).forEach(questionDao::remove);
        sessionDao.findAll().stream().filter(s -> id.equals(s.getLessonId())).forEach(sessionDao::remove);
    }
}
