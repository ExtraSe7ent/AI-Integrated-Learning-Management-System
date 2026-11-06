package vn.edu.vju.lms.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.StudySession;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.service.StudySessionService;
import vn.edu.vju.lms.wrapper.StudySessionWrapper;

/**
 * UC-A02. A session opens and closes by itself from its times (BR-01). Once published, students rely on it, so
 * only its end may move, and only later (AF-1 gia hạn).
 */
@Service
public class StudySessionServiceImpl extends AbstractCrudService<StudySession, StudySessionWrapper> implements StudySessionService {

    static final int TITLE_MAX = 200;

    private final IStudySessionDao dao;
    private final TeachingScope scope;

    public StudySessionServiceImpl(IStudySessionDao dao, TeachingScope scope) {
        this.dao = dao;
        this.scope = scope;
    }

    @Override
    protected IGenericDao<String, StudySession> dao() {
        return dao;
    }

    @Override
    protected StudySession newEntity() {
        return new StudySession();
    }

    @Override
    protected StudySessionWrapper toWrapper(StudySession entity) {
        StudySessionWrapper wrapper = new StudySessionWrapper();
        wrapper.setId(entity.getId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setOpens(entity.getOpens());
        wrapper.setCloses(entity.getCloses());
        wrapper.setPublished(entity.getPublished());
        wrapper.setLate(entity.getLate());
        wrapper.setLessonId(TeachingScope.lessonOr(entity.getLessonId()));
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(StudySessionWrapper wrapper, StudySession entity) {
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle().trim());
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
        if (wrapper.getLate() != null) {
            entity.setLate(wrapper.getLate());
        }
        if (wrapper.getLessonId() != null) {
            entity.setLessonId(wrapper.getLessonId().trim());
        }
    }

    @Override
    protected String wrapperId(StudySessionWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(StudySession entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy phiên tự học.";
    }

    @Override
    protected void beforeCreate(StudySessionWrapper wrapper, StudySession entity) {
        if (!StringUtils.hasText(entity.getLessonId())) {
            entity.setLessonId(TeachingScope.DEFAULT_LESSON);
        }
        if (entity.getPublished() == null) {
            entity.setPublished(false);
        }
        if (entity.getLate() == null) {
            entity.setLate(false);
        }
    }

    @Override
    protected void beforeSave(StudySession entity) {
        if (!StringUtils.hasText(entity.getTitle()) || entity.getTitle().length() > TITLE_MAX) {
            throw new BusinessRuleException("Tên phiên tự học bắt buộc và tối đa " + TITLE_MAX + " ký tự.");
        }
        LocalDateTime opens = parse(entity.getOpens(), "bắt đầu");
        LocalDateTime closes = parse(entity.getCloses(), "kết thúc");
        if (!closes.isAfter(opens)) {
            throw new BusinessRuleException("Thời điểm đóng phải sau thời điểm mở.");
        }
        scope.requireLesson(entity.getLessonId());
    }

    @Override
    @Transactional
    public StudySessionWrapper update(String id, StudySessionWrapper wrapper) {
        StudySession current = require(id);
        scope.requireLesson(current.getLessonId());
        if (Boolean.TRUE.equals(current.getPublished())) {
            boolean changed = changes(wrapper.getTitle(), current.getTitle())
                    || changes(wrapper.getOpens(), current.getOpens())
                    || changes(wrapper.getLessonId(), TeachingScope.lessonOr(current.getLessonId()))
                    || (wrapper.getLate() != null && !wrapper.getLate().equals(current.getLate()));
            if (changed) {
                throw new BusinessRuleException("Phiên đã công bố chỉ được gia hạn thời gian kết thúc.");
            }
            if (wrapper.getCloses() != null
                    && parse(wrapper.getCloses(), "kết thúc").isBefore(parse(current.getCloses(), "kết thúc"))) {
                throw new BusinessRuleException("Phiên đã công bố chỉ được gia hạn, không rút ngắn.");
            }
        }
        return super.update(id, wrapper);
    }

    @Override
    protected void checkDelete(StudySession entity) {
        scope.requireLesson(entity.getLessonId());
        if (scope.sessionStarted(entity.getId())) {
            throw new BusinessRuleException("Phiên đã có sinh viên học, không thể xóa. Hãy ẩn phiên nếu cần.");
        }
    }

    private static boolean changes(String requested, String current) {
        return requested != null && !Objects.equals(requested.trim(), current);
    }

    /** The frontend sends datetime-local values such as 2026-10-16T08:00. */
    private static LocalDateTime parse(String value, String label) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessRuleException("Thiếu thời điểm " + label + ".");
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            throw new BusinessRuleException("Thời điểm " + label + " không hợp lệ: " + value);
        }
    }
}
