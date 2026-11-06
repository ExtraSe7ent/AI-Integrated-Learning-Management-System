package vn.edu.vju.lms.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.dao.ICoordinationCompletionDao;
import vn.edu.vju.lms.dao.INoticeDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.CoordinationCompletion;
import vn.edu.vju.lms.entity.Notice;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AppealService;
import vn.edu.vju.lms.service.AssessmentService;
import vn.edu.vju.lms.service.AssignmentService;
import vn.edu.vju.lms.service.BootstrapService;
import vn.edu.vju.lms.service.ChangeRequestService;
import vn.edu.vju.lms.service.ChatService;
import vn.edu.vju.lms.service.ClassInfoService;
import vn.edu.vju.lms.service.CoordinationItemService;
import vn.edu.vju.lms.service.CourseService;
import vn.edu.vju.lms.service.FeedbackService;
import vn.edu.vju.lms.service.KnowledgeGapService;
import vn.edu.vju.lms.service.LessonService;
import vn.edu.vju.lms.service.LiveService;
import vn.edu.vju.lms.service.QuestionService;
import vn.edu.vju.lms.service.ReferenceItemService;
import vn.edu.vju.lms.service.ReminderService;
import vn.edu.vju.lms.service.ResourceItemService;
import vn.edu.vju.lms.service.StudyProgressService;
import vn.edu.vju.lms.service.StudySessionService;
import vn.edu.vju.lms.wrapper.AppealWrapper;
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;
import vn.edu.vju.lms.wrapper.FeedbackWrapper;
import vn.edu.vju.lms.wrapper.KnowledgeGapWrapper;
import vn.edu.vju.lms.wrapper.LessonWrapper;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@Service
public class BootstrapServiceImpl implements BootstrapService {

    private static final String STUDENT_AUDIENCE = "student";
    private static final String TEACHER_AUDIENCE = "teacher";

    private final IUserAccountDao userDao;
    private final INoticeDao noticeDao;
    private final ICoordinationCompletionDao completionDao;
    private final CourseService courses;
    private final ClassInfoService classes;
    private final LessonService lessons;
    private final QuestionService questions;
    private final StudySessionService sessions;
    private final AssignmentService assignments;
    private final ResourceItemService resources;
    private final KnowledgeGapService gaps;
    private final FeedbackService feedback;
    private final AppealService appeals;
    private final ReminderService reminders;
    private final CoordinationItemService coordinationItems;
    private final ChangeRequestService changeRequests;
    private final ReferenceItemService references;
    private final AssessmentService assessments;
    private final StudyProgressService studyProgress;
    private final LiveService live;
    private final ChatService chat;

    public BootstrapServiceImpl(IUserAccountDao userDao, INoticeDao noticeDao, ICoordinationCompletionDao completionDao,
            CourseService courses, ClassInfoService classes, LessonService lessons, QuestionService questions,
            StudySessionService sessions, AssignmentService assignments, ResourceItemService resources,
            KnowledgeGapService gaps, FeedbackService feedback, AppealService appeals, ReminderService reminders,
            CoordinationItemService coordinationItems, ChangeRequestService changeRequests, ReferenceItemService references,
            AssessmentService assessments, StudyProgressService studyProgress, LiveService live, ChatService chat) {
        this.userDao = userDao;
        this.noticeDao = noticeDao;
        this.completionDao = completionDao;
        this.courses = courses;
        this.classes = classes;
        this.lessons = lessons;
        this.questions = questions;
        this.sessions = sessions;
        this.assignments = assignments;
        this.resources = resources;
        this.gaps = gaps;
        this.feedback = feedback;
        this.appeals = appeals;
        this.reminders = reminders;
        this.coordinationItems = coordinationItems;
        this.changeRequests = changeRequests;
        this.references = references;
        this.assessments = assessments;
        this.studyProgress = studyProgress;
        this.live = live;
        this.chat = chat;
    }

    @Override
    @Transactional
    public Map<String, Object> load() {
        UserPrincipal user = UserPrincipal.current();
        UserAccount me = userDao.findById(user.id())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("admin", administration(user));
        data.put("aiReminders", user.isStudent() ? List.of() : reminders.listAll());
        data.put("lessons", lessonsFor(user));
        data.put("questions", questions.listAll());
        data.put("sessions", sessions.listAll());
        data.put("assignments", assignments.listAll());
        data.put("resources", resources.listAll());
        data.put("studySessions", studyProgress.visibleToCurrentUser());
        data.put("assessments", assessments.visibleToCurrentUser());
        data.put("gaps", ownedGaps(user));
        data.put("feedback", ownedFeedback(user));
        data.put("appeals", ownedAppeals(user));
        data.put("notes", me.getNotes() == null ? "" : me.getNotes());
        data.put("chat", chat.mine());
        data.put("live", live.state());
        data.put("coordination", coordination(user));
        data.put("notices", notices(STUDENT_AUDIENCE));
        data.put("teacherNotices", notices(TEACHER_AUDIENCE));
        data.putAll(profileAndReadFlags(me));
        return data;
    }

    private Map<String, Object> administration(UserPrincipal user) {
        Map<String, Object> admin = new LinkedHashMap<>();
        admin.put("users", users(user));
        admin.put("courses", courses.listAll());
        admin.put("classes", classes.listAll().stream().map(info -> visibleClass(info, user)).toList());
        return admin;
    }

    /** Only admins see contact details; other roles get the directory data the screens need. */
    private List<UserAccountWrapper> users(UserPrincipal user) {
        return userDao.findAll().stream().map(UserAccountServiceImpl::toUserWrapper).map(wrapper -> {
            if (user.role() != Role.ADMIN && !user.id().equals(wrapper.getId())) {
                wrapper.setEmail("");
                wrapper.setPhone(null);
            }
            return wrapper;
        }).toList();
    }

    /** A student must not learn who else is in a class. */
    private ClassInfoWrapper visibleClass(ClassInfoWrapper info, UserPrincipal user) {
        if (user.isStudent()) {
            info.setStudentIds(info.getStudentIds().stream().filter(user.id()::equals).toList());
        }
        return info;
    }

    private List<LessonWrapper> lessonsFor(UserPrincipal user) {
        return lessons.listAll().stream()
                .filter(lesson -> !user.isStudent() || Boolean.TRUE.equals(lesson.getPublished())).toList();
    }

    private List<KnowledgeGapWrapper> ownedGaps(UserPrincipal user) {
        return gaps.listAll().stream().filter(gap -> !user.isStudent() || user.id().equals(gap.getOwnerId())).toList();
    }

    private List<FeedbackWrapper> ownedFeedback(UserPrincipal user) {
        return feedback.listAll().stream().filter(item -> !user.isStudent() || user.id().equals(item.getOwnerId())).toList();
    }

    private List<AppealWrapper> ownedAppeals(UserPrincipal user) {
        return appeals.listAll().stream().filter(item -> !user.isStudent() || user.id().equals(item.getOwnerId())).toList();
    }

    private Map<String, Object> coordination(UserPrincipal user) {
        Map<String, Object> coordination = new LinkedHashMap<>();
        boolean staff = !user.isStudent();
        coordination.put("items", staff ? coordinationItems.listAll() : List.of());
        coordination.put("requests", staff ? changeRequests.listAll() : List.of());
        coordination.put("completed", staff
                ? completionDao.findAll().stream().map(CoordinationCompletion::getClassId).toList() : List.of());
        coordination.put("references", staff ? references.listAll() : List.of());
        return coordination;
    }

    private List<String> notices(String audience) {
        return new ArrayList<>(noticeDao.findAll().stream()
                .filter(notice -> audience.equals(notice.getAudience())).map(Notice::getMessage).toList());
    }

    private Map<String, Object> profileAndReadFlags(UserAccount me) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", me.getName());
        profile.put("email", me.getEmail());
        profile.put("phone", me.getPhone() == null ? "" : me.getPhone());
        profile.put("major", me.getMajor() == null ? "" : me.getMajor());
        Map<String, Object> result = new LinkedHashMap<>();
        switch (me.getRole()) {
            case LECTURER -> {
                result.put("teacherProfile", profile);
                result.put("readTeacherNotices", me.isNoticesRead());
            }
            case DEAN -> {
                result.put("deanProfile", profile);
                result.put("readDeanNotices", me.isNoticesRead());
            }
            case COURSE_LEADER -> {
                result.put("leaderProfile", profile);
                result.put("readLeaderNotices", me.isNoticesRead());
            }
            default -> {
                result.put("profile", profile);
                result.put("readNotices", me.isNoticesRead());
            }
        }
        return result;
    }
}
