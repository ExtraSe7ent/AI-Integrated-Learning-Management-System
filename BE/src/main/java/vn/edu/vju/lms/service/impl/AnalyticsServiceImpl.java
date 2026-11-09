package vn.edu.vju.lms.service.impl;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IChatMessageDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.dao.IKnowledgeGapDao;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.Assessment;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Course;
import vn.edu.vju.lms.entity.KnowledgeGap;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.entity.StudyProgress;
import vn.edu.vju.lms.entity.StudySession;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AnalyticsService;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.ClassReport;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.PageReport;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.Report;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.StudentReport;

/** BR-03 and BR-04 are computed here so every dashboard and grade sheet shows the same numbers. */
@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final int DEFAULT_SLIDES = 4;

    private final IClassInfoDao classDao;
    private final ICourseDao courseDao;
    private final IUserAccountDao userDao;
    private final IStudySessionDao sessionDao;
    private final IAssignmentDao assignmentDao;
    private final IStudyProgressDao progressDao;
    private final IAssessmentDao assessmentDao;
    private final IChatMessageDao chatDao;
    private final ILessonDao lessonDao;
    private final IQuestionDao questionDao;
    private final IKnowledgeGapDao gapDao;
    private final vn.edu.vju.lms.dao.IFeedbackDao feedbackDao;
    private final ZoneId zone;

    public AnalyticsServiceImpl(IClassInfoDao classDao, ICourseDao courseDao, IUserAccountDao userDao,
            IStudySessionDao sessionDao, IAssignmentDao assignmentDao, IStudyProgressDao progressDao,
            IAssessmentDao assessmentDao, IChatMessageDao chatDao, ILessonDao lessonDao, IQuestionDao questionDao,
            IKnowledgeGapDao gapDao, vn.edu.vju.lms.dao.IFeedbackDao feedbackDao, LmsProperties properties) {
        this.feedbackDao = feedbackDao;
        this.classDao = classDao;
        this.courseDao = courseDao;
        this.userDao = userDao;
        this.sessionDao = sessionDao;
        this.assignmentDao = assignmentDao;
        this.progressDao = progressDao;
        this.assessmentDao = assessmentDao;
        this.chatDao = chatDao;
        this.lessonDao = lessonDao;
        this.questionDao = questionDao;
        this.gapDao = gapDao;
        this.zone = ZoneId.of(properties.getTimeZone());
    }

    @Override
    @Transactional(readOnly = true)
    public Report report() {
        UserPrincipal user = UserPrincipal.current();
        if (user.isStudent()) {
            return new Report(List.of(), List.of());
        }
        Map<String, Course> courses = courseDao.findAll().stream().collect(Collectors.toMap(Course::getId, Function.identity()));
        Map<String, UserAccount> users = userDao.findAll().stream().collect(Collectors.toMap(UserAccount::getId, Function.identity()));
        List<StudySession> sessions = sessionDao.findAll().stream().filter(s -> Boolean.TRUE.equals(s.getPublished())).toList();
        List<Assignment> assignments = assignmentDao.findAll().stream().filter(a -> Boolean.TRUE.equals(a.getPublished())).toList();
        int slides = lessonDao.findAll().stream().map(Lesson::getSlides).filter(list -> list != null && !list.isEmpty())
                .mapToInt(List::size).max().orElse(DEFAULT_SLIDES);
        List<ClassReport> classes = classDao.findAll().stream().filter(info -> visible(info, user)).map(info -> {
            Course course = courses.get(info.getCourseId());
            UserAccount teacher = users.get(info.getTeacherId());
            List<StudentReport> students = info.getStudentIds().stream().filter(users::containsKey)
                    .map(id -> student(users.get(id),
                            sessions.stream().filter(s -> lessonDao.findById(vn.edu.vju.lms.security.TeachingScope.lessonOr(s.getLessonId())).filter(l -> info.getId().equals(vn.edu.vju.lms.security.TeachingScope.classOf(l))).isPresent()).toList(),
                            assignments.stream().filter(a -> info.getId().equals(a.getClassId())).toList(), slides)).toList();
            return new ClassReport(info.getId(), info.getName(), info.getCourseId(),
                    course == null ? info.getCourseId() : course.getCode(), course == null ? "" : course.getTitle(),
                    teacher == null ? "" : teacher.getName(), info.getTerm(), info.getYear(), students);
        }).toList();
        return new Report(classes, pages());
    }

    private boolean visible(ClassInfo info, UserPrincipal user) {
        return switch (user.role()) {
            case LECTURER -> user.id().equals(info.getTeacherId());
            case COURSE_LEADER -> user.id().equals(info.getLeaderId());
            default -> user.role() == Role.DEAN || user.role() == Role.ADMIN;
        };
    }

    private StudentReport student(UserAccount account, List<StudySession> sessions, List<Assignment> assignments, int slides) {
        Map<String, StudyProgress> progress = progressDao.findByStudent(account.getId()).stream()
                .collect(Collectors.toMap(StudyProgress::getSessionId, Function.identity()));
        Map<String, Assessment> work = assessmentDao.findByStudent(account.getId()).stream()
                .filter(record -> record.getScore() != null)
                .collect(Collectors.toMap(Assessment::getAssignmentId, Function.identity()));
        int percent = 0;
        int onTime = 0;
        for (StudySession session : sessions) {
            StudyProgress record = progress.get(session.getId());
            if (record != null) {
                percent += Math.min(100, record.getProgress() * 100 / slides);
                onTime += isOnTime(record, session) ? 1 : 0;
            }
        }
        List<Double> scores = assignments.stream().map(a -> work.get(a.getId())).filter(r -> r != null).map(Assessment::getScore).toList();
        double average = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        int checked = 0;
        int right = 0;
        java.time.LocalDateTime latest = null;
        String lastSubmitted = null;
        for (Assignment assignment : assignments) {
            Assessment record = work.get(assignment.getId());
            if (record == null) {
                continue;
            }
            List<vn.edu.vju.lms.entity.ExamQuestion> questions = vn.edu.vju.lms.service.AssessmentGrader.questionsOf(assignment);
            List<String> answers = record.getAnswers() == null ? List.of() : record.getAnswers();
            for (int i = 0; i < questions.size(); i++) {
                if (!questions.get(i).isEssay()) {
                    checked++;
                    right += vn.edu.vju.lms.service.AssessmentGrader.isCorrect(questions.get(i), i < answers.size() ? answers.get(i) : null) ? 1 : 0;
                }
            }
            java.time.LocalDateTime at = submittedAt(record.getSubmitted());
            if (at != null && (latest == null || at.isAfter(latest))) {
                latest = at;
                lastSubmitted = record.getSubmitted();
            }
        }
        int feedback = (int) feedbackDao.findAll().stream().filter(f -> account.getId().equals(f.getOwnerId())).count();
        return new StudentReport(account.getId(), account.getName(), account.getEmail(),
                sessions.isEmpty() ? 0 : percent / sessions.size(),
                sessions.isEmpty() ? 0 : oneDecimal(onTime * 10.0 / sessions.size()),
                oneDecimal(average), scores.size(), chatDao.findByOwner(account.getId()).size(),
                checked == 0 ? null : Math.round(right * 100f / checked), lastSubmitted, feedback);
    }

    private static final java.time.format.DateTimeFormatter SUBMITTED =
            java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    private static java.time.LocalDateTime submittedAt(String value) {
        try {
            return StringUtils.hasText(value) ? java.time.LocalDateTime.parse(value, SUBMITTED) : null;
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private boolean isOnTime(StudyProgress record, StudySession session) {
        if (!StringUtils.hasText(record.getCompletedAt()) || !StringUtils.hasText(session.getCloses())) {
            return false;
        }
        try {
            Instant closes = LocalDateTime.parse(session.getCloses()).atZone(zone).toInstant();
            return Instant.parse(record.getCompletedAt()).isBefore(closes);
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    private List<PageReport> pages() {
        List<Question> questions = questionDao.findAll();
        List<StudyProgress> progress = progressDao.findAll();
        List<KnowledgeGap> gaps = gapDao.findAll();
        List<Integer> numbers = new ArrayList<>(questions.stream().map(Question::getPage).filter(p -> p != null).toList());
        gaps.stream().map(KnowledgeGap::getPage).filter(p -> p != null).forEach(numbers::add);
        return numbers.stream().distinct().sorted().map(page -> {
            int answered = 0;
            int wrong = 0;
            for (Question question : questions) {
                if (page.equals(question.getPage())) {
                    for (StudyProgress record : progress) {
                        Integer choice = record.getAnswers() == null ? null : record.getAnswers().get(question.getId());
                        if (choice != null) {
                            answered++;
                            wrong += choice.equals(question.getCorrect()) ? 0 : 1;
                        }
                    }
                }
            }
            int open = (int) gaps.stream().filter(gap -> page.equals(gap.getPage()) && !StringUtils.hasText(gap.getResponse())).count();
            return new PageReport(page, answered, wrong, open);
        }).toList();
    }

    private double oneDecimal(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
