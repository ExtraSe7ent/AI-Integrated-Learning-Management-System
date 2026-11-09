package vn.edu.vju.lms;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Course;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.JwtService;
import vn.edu.vju.lms.security.Role;

/** Full-stack test base: real security filter chain, services and an in-memory H2 database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractApiTest {

    protected static final String ADMIN = "AD001";
    protected static final String LECTURER = "GV001";
    protected static final String STUDENT = "SV001";
    protected static final String OTHER_STUDENT = "SV002";
    protected static final String LEADER = "TN001";
    protected static final String DEAN = "TK001";
    protected static final String PASSWORD = "12345678";
    protected static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper mapper;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected IUserAccountDao userDao;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected AesService aesService;

    @Autowired
    protected TransactionTemplate tx;

    @Autowired
    protected IClassInfoDao classDao;

    @Autowired
    protected ICourseDao courseDao;

    @Autowired
    protected ILessonDao lessonDao;

    @BeforeEach
    void accounts() {
        account(ADMIN, Role.ADMIN, "admin");
        account(LECTURER, Role.LECTURER, "teacher");
        account(STUDENT, Role.STUDENT, "student");
        account(OTHER_STUDENT, Role.STUDENT, "student");
        account(LEADER, Role.COURSE_LEADER, "teacher");
        account(DEAN, Role.DEAN, "teacher");
        teachingFixture();
    }

    /** The demo class and lesson that content without an explicit owner belongs to (see TeachingScope). */
    private void teachingFixture() {
        tx.executeWithoutResult(s -> {
            if (classDao.findById(TeachingScope.DEFAULT_CLASS).isEmpty()) {
                if (courseDao.findById("cs301").isEmpty()) {
                    Course course = new Course();
                    course.setId("cs301");
                    course.setCode("CSE301");
                    course.setTitle("Phát triển ứng dụng web");
                    course.setFaculty("CNTT");
                    courseDao.persist(course);
                }
                ClassInfo info = new ClassInfo();
                info.setId(TeachingScope.DEFAULT_CLASS);
                info.setCourseId("cs301");
                info.setName(TeachingScope.DEFAULT_CLASS);
                info.setTerm("I");
                info.setYear("2026–2027");
                info.setRound("1");
                info.setTeacherId(LECTURER);
                info.setLeaderId(LEADER);
                info.setStudentIds(new java.util.ArrayList<>(java.util.List.of(STUDENT, OTHER_STUDENT)));
                classDao.persist(info);
            }
            ClassInfo defaultClass=classDao.findById(TeachingScope.DEFAULT_CLASS).orElseThrow();
            for(String student:java.util.List.of(STUDENT,OTHER_STUDENT)) if(!defaultClass.getStudentIds().contains(student)) defaultClass.getStudentIds().add(student);
            if (lessonDao.findById(TeachingScope.DEFAULT_LESSON).isEmpty()) {
                Lesson lesson = new Lesson();
                lesson.setId(TeachingScope.DEFAULT_LESSON);
                lesson.setClassId(TeachingScope.DEFAULT_CLASS);
                lesson.setTitle("Thiết kế RESTful API");
                lesson.setOrder(2);
                lesson.setPublished(true);
                lesson.setActivity(false);
                lessonDao.persist(lesson);
            }
        });
    }

    private void account(String id, Role role, String kind) {
        if (userDao.findById(id).isPresent()) {
            return;
        }
        UserAccount user = new UserAccount();
        user.setId(id);
        user.setName("Người dùng " + id);
        user.setEmail(id.toLowerCase() + "@example.edu");
        user.setEmailHash(aesService.blindIndex(user.getEmail()));
        user.setFaculty("CNTT");
        user.setKind(kind);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        tx.executeWithoutResult(s -> userDao.persist(user));
    }

    protected HttpHeaders auth(String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.issue(userId));
        return headers;
    }

    protected String json(Object value) throws JsonProcessingException {
        return mapper.writeValueAsString(value);
    }
}
