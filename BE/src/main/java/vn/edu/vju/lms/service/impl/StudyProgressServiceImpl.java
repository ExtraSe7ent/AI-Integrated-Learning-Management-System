package vn.edu.vju.lms.service.impl;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.entity.StudyProgress;
import vn.edu.vju.lms.entity.StudySession;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.StudyProgressService;
import vn.edu.vju.lms.wrapper.StudyProgressWrapper;

/**
 * UC-B01–B03. Nothing about progress is taken on trust: the server checks the session window (BR-01), that every
 * pre-class quiz up to the page was answered (BR-09), and stamps completion with its own clock, so the self-study
 * score cannot be raised from the browser.
 */
@Service
public class StudyProgressServiceImpl implements StudyProgressService {

    /** The demo lesson has four built-in slides and no stored titles. */
    static final int DEFAULT_PAGES = 4;

    private final IStudyProgressDao progressDao;
    private final IStudySessionDao sessionDao;
    private final ILessonDao lessonDao;
    private final IClassInfoDao classDao;
    private final IQuestionDao questionDao;
    private final ZoneId zone;

    public StudyProgressServiceImpl(IStudyProgressDao progressDao, IStudySessionDao sessionDao, ILessonDao lessonDao,
            IClassInfoDao classDao, IQuestionDao questionDao, LmsProperties properties) {
        this.progressDao = progressDao;
        this.sessionDao = sessionDao;
        this.lessonDao = lessonDao;
        this.classDao = classDao;
        this.questionDao = questionDao;
        this.zone = ZoneId.of(properties.getTimeZone());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, StudyProgressWrapper> visibleToCurrentUser() {
        UserPrincipal user = UserPrincipal.current();
        List<StudyProgress> records = user.isStudent() ? progressDao.findByStudent(user.id()) : progressDao.findAll();
        Map<String, StudyProgressWrapper> result = new HashMap<>();
        for (StudyProgress record : records) {
            result.merge(record.getSessionId(), toWrapper(record),
                    (kept, next) -> next.getProgress() > kept.getProgress() ? next : kept);
        }
        return result;
    }

    /** Session, lesson and the caller's own record, after checking the student may study it now. */
    private record Context(StudySession session, Lesson lesson, StudyProgress record, int pages) {
    }

    private Context open(String sessionId) {
        StudySession session = sessionDao.findById(sessionId)
                .filter(s -> Boolean.TRUE.equals(s.getPublished()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên tự học."));
        Lesson lesson = lessonDao.findById(TeachingScope.lessonOr(session.getLessonId()))
                .orElseThrow(() -> new BusinessRuleException("Phiên tự học chưa gắn bài học hợp lệ."));
        String studentId = UserPrincipal.current().id();
        boolean enrolled = classDao.findById(TeachingScope.classOf(lesson))
                .map(info -> info.getStudentIds().contains(studentId)).orElse(false);
        if (!enrolled) {
            throw new ForbiddenOperationException("Bạn không thuộc lớp của phiên tự học này.");
        }
        Instant now = Instant.now();
        if (now.isBefore(instant(session.getOpens()))) {
            throw new BusinessRuleException("Phiên tự học chưa mở.");
        }
        String id = studentId + ":" + sessionId;
        StudyProgress record = progressDao.findById(id).orElseGet(() -> {
            StudyProgress created = new StudyProgress();
            created.setId(id);
            created.setStudentId(studentId);
            created.setSessionId(sessionId);
            created.setAnswers(new HashMap<>());
            return progressDao.persist(created);
        });
        // AF-1 of UC-B01: an expired session can be read again, but nothing new is recorded.
        if (record.getCompletedAt() == null && !Boolean.TRUE.equals(session.getLate())
                && !now.isBefore(instant(session.getCloses()))) {
            throw new BusinessRuleException("Phiên tự học đã hết hạn; bạn vẫn xem lại được nhưng tiến độ không được ghi nhận.");
        }
        int pages = lesson.getSlides() == null || lesson.getSlides().isEmpty() ? DEFAULT_PAGES : lesson.getSlides().size();
        return new Context(session, lesson, record, pages);
    }

    @Override
    @Transactional
    public StudyProgressWrapper save(String sessionId, StudyProgressWrapper wrapper) {
        Context context = open(sessionId);
        StudyProgress record = context.record();
        if (record.getCompletedAt() != null) {
            return toWrapper(record); // AF-2: reviewing a finished session changes nothing.
        }
        Map<String, Integer> answers = new HashMap<>(record.getAnswers() == null ? Map.of() : record.getAnswers());
        Map<String, Question> quiz = quizOf(context.lesson());
        if (wrapper.getAnswers() != null) {
            wrapper.getAnswers().forEach((questionId, choice) -> {
                Question question = quiz.get(questionId);
                // The first answer stays: changing it later would turn a wrong answer into a right one.
                if (question != null && choice != null && choice >= 0 && choice < question.getOptions().size()) {
                    answers.putIfAbsent(questionId, choice);
                }
            });
        }
        int requested = Math.min(Math.max(wrapper.getProgress(), 0), context.pages());
        int progress = Math.max(record.getProgress(), requested);
        for (Question question : quiz.values()) {
            if (question.getPage() != null && question.getPage() <= progress && !answers.containsKey(question.getId())) {
                throw new BusinessRuleException("Cần trả lời câu hỏi của trang " + question.getPage() + " trước khi tiếp tục.");
            }
        }
        record.setAnswers(answers);
        record.setProgress(progress);
        if (progress >= context.pages()) {
            record.setCompletedAt(Instant.now().toString());
        }
        return toWrapper(record);
    }

    @Override
    @Transactional
    public QuizResult answer(String sessionId, String questionId, int choice) {
        Context context = open(sessionId);
        Question question = quizOf(context.lesson()).get(questionId);
        if (question == null) {
            throw new ResourceNotFoundException("Câu hỏi không thuộc bài học của phiên này.");
        }
        if (choice < 0 || choice >= question.getOptions().size()) {
            throw new BusinessRuleException("Đáp án không hợp lệ.");
        }
        StudyProgress record = context.record();
        Map<String, Integer> answers = new HashMap<>(record.getAnswers() == null ? Map.of() : record.getAnswers());
        if (record.getCompletedAt() == null) {
            answers.putIfAbsent(questionId, choice);
            record.setAnswers(answers);
        }
        Integer given = answers.getOrDefault(questionId, choice);
        return new QuizResult(given.equals(question.getCorrect()), question.getCorrect(), question.getExplanation(),
                toWrapper(record));
    }

    /** Approved quizzes of the lesson; drafts never block or count. */
    private Map<String, Question> quizOf(Lesson lesson) {
        Map<String, Question> quiz = new HashMap<>();
        questionDao.findAll().stream()
                .filter(q -> Boolean.TRUE.equals(q.getApproved()) && lesson.getId().equals(TeachingScope.lessonOr(q.getLessonId())))
                .forEach(q -> quiz.put(q.getId(), q));
        return quiz;
    }

    private Instant instant(String localDateTime) {
        return LocalDateTime.parse(localDateTime).atZone(zone).toInstant();
    }

    private StudyProgressWrapper toWrapper(StudyProgress record) {
        StudyProgressWrapper wrapper = new StudyProgressWrapper();
        wrapper.setProgress(record.getProgress());
        wrapper.setAnswers(record.getAnswers());
        wrapper.setCompletedAt(record.getCompletedAt());
        return wrapper;
    }
}
