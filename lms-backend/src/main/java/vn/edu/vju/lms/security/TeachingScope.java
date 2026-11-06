package vn.edu.vju.lms.security;

import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.entity.StudyProgress;

/**
 * Who may change a class's teaching content (UC-G02, UC-A01, UC-A02): the class's lecturer, its course leader
 * (Trưởng nhóm HP, the secondary actor) and Admin. Everyone else gets 403 even with a lecturer role.
 */
@Component
public class TeachingScope {

    /** Rows created before lessons, questions and sessions carried their owner belong to the demo lesson. */
    public static final String DEFAULT_CLASS = "CSE301.01";
    public static final String DEFAULT_LESSON = "l2";

    private final IClassInfoDao classDao;
    private final ILessonDao lessonDao;
    private final IStudySessionDao sessionDao;
    private final IStudyProgressDao progressDao;

    public TeachingScope(IClassInfoDao classDao, ILessonDao lessonDao, IStudySessionDao sessionDao,
            IStudyProgressDao progressDao) {
        this.classDao = classDao;
        this.lessonDao = lessonDao;
        this.sessionDao = sessionDao;
        this.progressDao = progressDao;
    }

    public static String classOf(Lesson lesson) {
        return StringUtils.hasText(lesson.getClassId()) ? lesson.getClassId() : DEFAULT_CLASS;
    }

    public static String lessonOr(String lessonId) {
        return StringUtils.hasText(lessonId) ? lessonId : DEFAULT_LESSON;
    }

    public void requireClass(String classId) {
        UserPrincipal user = caller();
        if (user == null || user.role() == Role.ADMIN) {
            return;
        }
        ClassInfo info = classDao.findById(classId)
                .orElseThrow(() -> new BusinessRuleException("Lớp học phần không tồn tại: " + classId));
        boolean allowed = switch (user.role()) {
            case LECTURER -> user.id().equals(info.getTeacherId());
            case COURSE_LEADER -> user.id().equals(info.getLeaderId());
            default -> false;
        };
        if (!allowed) {
            throw new ForbiddenOperationException("Bạn không phụ trách lớp " + classId + ".");
        }
    }

    public Lesson requireLesson(String lessonId) {
        Lesson lesson = lessonDao.findById(lessonOr(lessonId))
                .orElseThrow(() -> new BusinessRuleException("Bài học không tồn tại: " + lessonOr(lessonId)));
        requireClass(classOf(lesson));
        return lesson;
    }

    /** True once any student opened a page or answered a quiz in one of the lesson's self-study sessions. */
    public boolean hasStudentData(String lessonId) {
        List<String> sessions = sessionDao.findAll().stream()
                .filter(session -> lessonId.equals(lessonOr(session.getLessonId()))).map(s -> s.getId()).toList();
        return !sessions.isEmpty() && progressDao.findAll().stream()
                .anyMatch(record -> sessions.contains(record.getSessionId()) && started(record));
    }

    public boolean sessionStarted(String sessionId) {
        return progressDao.findAll().stream().anyMatch(record -> sessionId.equals(record.getSessionId()) && started(record));
    }

    public boolean questionAnswered(String questionId) {
        return progressDao.findAll().stream()
                .anyMatch(record -> record.getAnswers() != null && record.getAnswers().containsKey(questionId));
    }

    private static boolean started(StudyProgress record) {
        return record.getProgress() > 0 || (record.getAnswers() != null && !record.getAnswers().isEmpty());
    }

    /** Null for the seeder and background jobs, which run without a caller. */
    private static UserPrincipal caller() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal ? principal : null;
    }
}
