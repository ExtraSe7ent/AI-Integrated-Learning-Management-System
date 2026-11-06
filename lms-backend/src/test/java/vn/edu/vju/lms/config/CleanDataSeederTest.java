package vn.edu.vju.lms.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import vn.edu.vju.lms.dao.IUserAccountDao;

/** LMS_SEED_DEMO=false and the "keep accounts" reset: an empty system with every demo account still able to log in. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "lms.seed.enabled=true",
    "lms.seed.demo=false",
    "spring.datasource.url=jdbc:h2:mem:lmsclean;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"})
class CleanDataSeederTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private DataSeeder seeder;

    @Autowired
    private IUserAccountDao userDao;

    @Autowired
    private TransactionTemplate tx;

    private String token(String id) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType("application/json")
                .content(mapper.writeValueAsString(Map.of("username", id, "password", "12345678"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).path("token").asText();
    }

    @Test
    void accountsOnlyThenClearingKeepsEveryAccount() throws Exception {
        String admin = token("AD001");
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.admin.users.length()").value(6))
                .andExpect(jsonPath("$.admin.courses.length()").value(0))
                .andExpect(jsonPath("$.admin.classes.length()").value(0))
                .andExpect(jsonPath("$.lessons.length()").value(0))
                .andExpect(jsonPath("$.questions.length()").value(0));
        mvc.perform(post("/api/courses").header("Authorization", "Bearer " + admin).contentType("application/json")
                .content(mapper.writeValueAsString(Map.of("id", "x1", "code", "X101", "title", "Học phần", "faculty", "CNTT"))))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/notices").header("Authorization", "Bearer " + admin).contentType("application/json")
                .content(mapper.writeValueAsString(Map.of("audience", "student", "message", "Thông báo")))).andExpect(status().isCreated());
        tx.executeWithoutResult(s -> userDao.findById("23110149").orElseThrow().setNotes("Ghi chú cũ"));

        seeder.clearKeepAccounts();

        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + token("AD001")))
                .andExpect(jsonPath("$.admin.users.length()").value(6))
                .andExpect(jsonPath("$.admin.courses.length()").value(0));
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + token("23110149")))
                .andExpect(jsonPath("$.notices.length()").value(0));
        tx.executeWithoutResult(s -> assertThat(userDao.findById("23110149").orElseThrow().getNotes()).isNull());
        token("GV001");
        token("TN001");
        token("TK001");
    }
}
