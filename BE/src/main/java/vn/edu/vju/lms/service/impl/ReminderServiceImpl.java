package vn.edu.vju.lms.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.dao.INoticeDao;
import vn.edu.vju.lms.dao.IReminderDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.entity.Notice;
import vn.edu.vju.lms.entity.Reminder;
import vn.edu.vju.lms.entity.StudyProgress;
import vn.edu.vju.lms.entity.StudySession;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.service.ReminderService;
import vn.edu.vju.lms.wrapper.ReminderWrapper;

@Service
public class ReminderServiceImpl extends AbstractCrudService<Reminder, ReminderWrapper> implements ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderServiceImpl.class);
    private static final Duration WINDOW = Duration.ofHours(24);
    private static final int DEFAULT_SLIDES = 4;
    private static final String SESSION = "session";
    private static final String IN_APP = "in-app";
    private static final String EMAIL = "email";
    private static final String FAILED = "failed";
    private static final DateTimeFormatter DUE = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private record Item(String kind, String id, String title, String due) {
    }

    private final IReminderDao dao;
    private final IClassInfoDao classDao;
    private final IUserAccountDao userDao;
    private final IStudySessionDao sessionDao;
    private final IAssignmentDao assignmentDao;
    private final IStudyProgressDao progressDao;
    private final IAssessmentDao assessmentDao;
    private final ILessonDao lessonDao;
    private final INoticeDao noticeDao;
    private final ObjectProvider<JavaMailSender> mail;
    private final TransactionTemplate transaction;
    private final LmsProperties.Reminder config;
    private final ZoneId zone;

    public ReminderServiceImpl(IReminderDao dao, IClassInfoDao classDao, IUserAccountDao userDao, IStudySessionDao sessionDao,
            IAssignmentDao assignmentDao, IStudyProgressDao progressDao, IAssessmentDao assessmentDao, ILessonDao lessonDao,
            INoticeDao noticeDao, ObjectProvider<JavaMailSender> mail, TransactionTemplate transaction, LmsProperties properties) {
        this.dao = dao;
        this.classDao = classDao;
        this.userDao = userDao;
        this.sessionDao = sessionDao;
        this.assignmentDao = assignmentDao;
        this.progressDao = progressDao;
        this.assessmentDao = assessmentDao;
        this.lessonDao = lessonDao;
        this.noticeDao = noticeDao;
        this.mail = mail;
        this.transaction = transaction;
        this.config = properties.getReminder();
        this.zone = ZoneId.of(properties.getTimeZone());
    }

    @Override
    public List<Map<String, Object>> candidates(String at) {
        LocalDateTime now = parse(at);
        return transaction.execute(s -> findCandidates(now));
    }

    private LocalDateTime parse(String at) {
        if (!StringUtils.hasText(at)) {
            return LocalDateTime.now(zone);
        }
        try {
            return LocalDateTime.parse(at);
        } catch (DateTimeParseException e) {
            throw new BusinessRuleException("Thời điểm kiểm tra không hợp lệ.");
        }
    }

    private List<Map<String, Object>> findCandidates(LocalDateTime now) {
        List<Item> due = dueItems(now);
        if (due.isEmpty()) {
            return List.of();
        }
        int slides = lessonDao.findAll().stream().map(Lesson::getSlides).filter(list -> list != null && !list.isEmpty())
                .mapToInt(List::size).max().orElse(DEFAULT_SLIDES);
        List<Map<String, Object>> rows = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ClassInfo info : classDao.findAll()) {
            for (String studentId : info.getStudentIds()) {
                UserAccount student = userDao.findById(studentId).filter(UserAccount::isActive).orElse(null);
                if (student == null || !StringUtils.hasText(student.getEmail())) {
                    continue;
                }
                for (Item item : due) {
                    String progress = progressOf(studentId, item, slides);
                    if (progress != null && seen.add(studentId + ":" + item.kind() + ":" + item.id())) {
                        rows.add(candidate(student, info, item, progress));
                    }
                }
            }
        }
        return rows;
    }

    private List<Item> dueItems(LocalDateTime now) {
        List<Item> items = new ArrayList<>();
        for (StudySession session : sessionDao.findAll()) {
            if (Boolean.TRUE.equals(session.getPublished())) {
                items.add(new Item(SESSION, session.getId(), session.getTitle(), session.getCloses()));
            }
        }
        for (Assignment assignment : assignmentDao.findAll()) {
            if (Boolean.TRUE.equals(assignment.getPublished())) {
                items.add(new Item("assignment", assignment.getId(), assignment.getTitle(), assignment.getCloses()));
            }
        }
        return items.stream().filter(item -> StringUtils.hasText(item.due())).filter(item -> {
            LocalDateTime due = LocalDateTime.parse(item.due());
            return due.isAfter(now) && !due.isAfter(now.plus(WINDOW));
        }).toList();
    }

    /** Null when the student already finished the item. */
    private String progressOf(String studentId, Item item, int slides) {
        if (!SESSION.equals(item.kind())) {
            return assessmentDao.find(studentId, item.id()).filter(record -> record.getScore() != null).isPresent()
                    ? null : "Chưa nộp";
        }
        StudyProgress record = progressDao.findByStudent(studentId).stream()
                .filter(progress -> item.id().equals(progress.getSessionId())).findFirst().orElse(null);
        if (record != null && StringUtils.hasText(record.getCompletedAt())) {
            return null;
        }
        return (record == null ? 0 : Math.min(100, record.getProgress() * 100 / slides)) + "% hoàn thành";
    }

    private Map<String, Object> candidate(UserAccount student, ClassInfo info, Item item, String progress) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", student.getId() + ":" + info.getId() + ":" + item.kind() + ":" + item.id() + ":" + item.due());
        row.put("studentId", student.getId());
        row.put("studentName", student.getName());
        row.put("email", student.getEmail());
        row.put("className", info.getName());
        row.put("kind", item.kind());
        row.put("itemId", item.id());
        row.put("title", item.title());
        row.put("due", item.due());
        row.put("progress", progress);
        return row;
    }

    /** Mail goes out with no transaction open: a slow SMTP server must not hold a database connection. */
    @Override
    public List<ReminderWrapper> scan(String at) {
        LocalDateTime now = parse(at);
        Set<String> done = transaction.execute(s -> {
            Set<String> keys = new HashSet<>();
            dao.findAll().stream().filter(reminder -> !FAILED.equals(reminder.getStatus()))
                    .forEach(reminder -> keys.add(reminder.getKey() + ":" + reminder.getChannel()));
            return keys;
        });
        List<ReminderWrapper> created = new ArrayList<>();
        Set<String> noticed = new LinkedHashSet<>();
        for (Map<String, Object> candidate : candidates(now.toString())) {
            String key = String.valueOf(candidate.get("key"));
            if (done.add(key + ":" + IN_APP)) {
                noticed.add(candidate.get("title") + " sắp đến hạn lúc " + dueText(candidate) + ".");
                created.add(record(key, candidate, IN_APP, "recorded"));
            }
            if (done.add(key + ":" + EMAIL)) {
                created.add(record(key, candidate, EMAIL, send(candidate)));
            }
        }
        publishNotices(noticed);
        log.info("Deadline scan recorded {} reminders", created.size());
        return created;
    }

    private String dueText(Map<String, Object> candidate) {
        return LocalDateTime.parse(String.valueOf(candidate.get("due"))).format(DUE);
    }

    private String send(Map<String, Object> candidate) {
        JavaMailSender sender = mail.getIfAvailable();
        if (sender == null || !StringUtils.hasText(config.getSmtpHost())) {
            return "skipped";
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(config.getMailFrom());
        message.setTo(String.valueOf(candidate.get("email")));
        boolean session = SESSION.equals(candidate.get("kind"));
        message.setSubject("Nhắc hạn " + (session ? "tự học" : "bài tập") + " · " + candidate.get("className"));
        message.setText("Chào " + candidate.get("studentName") + ",\n\n" + candidate.get("title") + " của lớp "
                + candidate.get("className") + " đến hạn lúc " + dueText(candidate) + ".\nTiến độ hiện tại: "
                + candidate.get("progress") + ".\n\nVui lòng hoàn thành trước hạn.\nVJU Learning");
        try {
            sender.send(message);
            return "sent";
        } catch (MailException e) {
            log.warn("Reminder email failed: {}", e.getMessage());
            return FAILED;
        }
    }

    private ReminderWrapper record(String key, Map<String, Object> candidate, String channel, String status) {
        Reminder reminder = new Reminder();
        reminder.setId(UUID.randomUUID().toString());
        reminder.setKey(key);
        reminder.setCreatedAt(Instant.now().toString());
        reminder.setCandidate(candidate);
        reminder.setChannel(channel);
        reminder.setStatus(status);
        transaction.executeWithoutResult(s -> dao.persist(reminder));
        return toWrapper(reminder);
    }

    /** Notices go to all students, so they name the item but never a student. */
    private void publishNotices(Set<String> messages) {
        transaction.executeWithoutResult(s -> messages.forEach(text -> {
            Notice notice = new Notice();
            notice.setId(UUID.randomUUID().toString());
            notice.setAudience("student");
            notice.setMessage(text);
            noticeDao.persist(notice);
        }));
    }

    @Override
    protected IGenericDao<String, Reminder> dao() {
        return dao;
    }

    @Override
    protected Reminder newEntity() {
        return new Reminder();
    }

    @Override
    protected ReminderWrapper toWrapper(Reminder entity) {
        ReminderWrapper wrapper = new ReminderWrapper();
        wrapper.setId(entity.getId());
        wrapper.setKey(entity.getKey());
        wrapper.setCreatedAt(entity.getCreatedAt());
        wrapper.setCandidate(entity.getCandidate());
        wrapper.setChannel(entity.getChannel());
        wrapper.setStatus(entity.getStatus());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ReminderWrapper wrapper, Reminder entity) {
        if (wrapper.getKey() != null) {
            entity.setKey(wrapper.getKey());
        }
        if (wrapper.getCreatedAt() != null) {
            entity.setCreatedAt(wrapper.getCreatedAt());
        }
        if (wrapper.getCandidate() != null) {
            entity.setCandidate(wrapper.getCandidate());
        }
        if (wrapper.getChannel() != null) {
            entity.setChannel(wrapper.getChannel());
        }
        if (wrapper.getStatus() != null) {
            entity.setStatus(wrapper.getStatus());
        }
    }

    @Override
    protected String wrapperId(ReminderWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Reminder entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy nhắc hạn.";
    }
}
