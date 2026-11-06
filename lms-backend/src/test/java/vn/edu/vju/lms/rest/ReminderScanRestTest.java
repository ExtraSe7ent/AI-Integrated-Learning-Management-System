package vn.edu.vju.lms.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.StudyProgress;
import vn.edu.vju.lms.entity.StudySession;
import vn.edu.vju.lms.service.ReminderJob;

@TestPropertySource(properties = "lms.reminder.smtp-host=smtp.test")
class ReminderScanRestTest extends AbstractApiTest {

    private static final String AT = "2090-05-05T00:00";
    private static final String DUE = "2090-05-05T12:00";

    @MockitoBean
    private JavaMailSender sender;

    @Autowired
    private IAssignmentDao assignmentDao;

    @Autowired
    private IStudySessionDao sessionDao;

    @Autowired
    private IStudyProgressDao progressDao;

    @Autowired
    private ReminderJob job;

    private String assignmentId;
    private String sessionId;

    @BeforeEach
    void data() {
        reset(sender);
        tx.executeWithoutResult(s -> {
            assignmentDao.findAll().stream().filter(a -> DUE.equals(a.getCloses())).forEach(a -> a.setPublished(false));
            sessionDao.findAll().stream().filter(x -> DUE.equals(x.getCloses())).forEach(x -> x.setPublished(false));
        });
        Assignment assignment = new Assignment();
        assignmentId = "rem-a-" + UUID.randomUUID();
        assignment.setId(assignmentId);
        assignment.setTitle("Bài cần nhắc");
        assignment.setOpens("2090-01-01T00:00");
        assignment.setCloses(DUE);
        assignment.setPublished(true);
        StudySession session = new StudySession();
        sessionId = "rem-s-" + UUID.randomUUID();
        session.setId(sessionId);
        session.setTitle("Phiên cần nhắc");
        session.setCloses(DUE);
        session.setPublished(true);
        ClassInfo info = new ClassInfo();
        info.setId("r-" + UUID.randomUUID().toString().substring(0, 30));
        info.setCourseId("c1");
        info.setName("Lớp nhắc");
        info.setStudentIds(new ArrayList<>(List.of(STUDENT)));
        tx.executeWithoutResult(s -> {
            assignmentDao.persist(assignment);
            sessionDao.persist(session);
            classDao.findAll().forEach(c -> c.getStudentIds().remove(STUDENT));
            classDao.persist(info);
        });
    }

    @Test
    void candidatesCoverOnlyUnfinishedWorkWithinTheWindow() throws Exception {
        mvc.perform(get("/api/reminders/candidates").param("at", AT).headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.kind=='assignment')].progress").value("Chưa nộp"))
                .andExpect(jsonPath("$[?(@.kind=='session')].progress").value("0% hoàn thành"));
        mvc.perform(get("/api/reminders/candidates").param("at", "2090-05-03T00:00").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/reminders/candidates").param("at", "2090-05-06T00:00").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(0)));
        StudyProgress done = new StudyProgress();
        done.setId(STUDENT + ":" + sessionId);
        done.setStudentId(STUDENT);
        done.setSessionId(sessionId);
        done.setProgress(4);
        done.setCompletedAt("2090-05-04T00:00:00Z");
        tx.executeWithoutResult(s -> progressDao.persist(done));
        mvc.perform(get("/api/reminders/candidates").param("at", AT).headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/reminders/candidates").param("at", "ngay-mai").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/reminders/candidates").param("at", AT).headers(auth(STUDENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void scanEmailsOnceAndRecordsEachChannel() throws Exception {
        mvc.perform(post("/api/reminders/scan").param("at", AT).headers(auth(ADMIN)))
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[?(@.channel=='email')].status").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("sent"))));
        ArgumentCaptor<SimpleMailMessage> mail = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender, times(2)).send(mail.capture());
        SimpleMailMessage first = mail.getAllValues().get(0);
        org.assertj.core.api.Assertions.assertThat(first.getTo()).containsExactly(STUDENT.toLowerCase() + "@example.edu");
        org.assertj.core.api.Assertions.assertThat(first.getText()).contains("Lớp nhắc", "12:00 05/05/2090");

        mvc.perform(post("/api/reminders/scan").param("at", AT).headers(auth(ADMIN)))
                .andExpect(jsonPath("$", hasSize(0)));
        verify(sender, times(2)).send(any(SimpleMailMessage.class));
    }

    @Test
    void failedEmailIsRetriedOnTheNextScan() throws Exception {
        doThrow(new MailSendException("SMTP lỗi")).when(sender).send(any(SimpleMailMessage.class));
        mvc.perform(post("/api/reminders/scan").param("at", AT).headers(auth(LECTURER)))
                .andExpect(jsonPath("$[?(@.channel=='email')].status").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("failed"))));
        reset(sender);
        mvc.perform(post("/api/reminders/scan").param("at", AT).headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.channel=='email')].status").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("sent"))));
    }

    @Test
    void scheduledRunUsesTheCurrentTimeWithoutALoggedInUser() {
        job.scan();
        verify(sender, times(0)).send(any(SimpleMailMessage.class));
    }
}
