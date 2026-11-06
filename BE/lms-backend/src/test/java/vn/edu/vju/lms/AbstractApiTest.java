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
import vn.edu.vju.lms.dao.IUserAccountDao;
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

    @BeforeEach
    void accounts() {
        account(ADMIN, Role.ADMIN, "admin");
        account(LECTURER, Role.LECTURER, "teacher");
        account(STUDENT, Role.STUDENT, "student");
        account(OTHER_STUDENT, Role.STUDENT, "student");
        account(LEADER, Role.COURSE_LEADER, "teacher");
        account(DEAN, Role.DEAN, "teacher");
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
