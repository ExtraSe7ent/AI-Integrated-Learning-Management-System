package vn.edu.vju.lms.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Boots with the demo seed on a separate database and logs in with every frontend account. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "e2e"})
@TestPropertySource(properties = {
    "lms.seed.enabled=true",
    "spring.datasource.url=jdbc:h2:mem:lmsseed;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"})
class DataSeederTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private String token(String id) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType("application/json")
                .content(mapper.writeValueAsString(Map.of("username", id, "password", "12345678"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).path("token").asText();
    }

    @Test
    void everyDemoAccountLogsInAndGetsItsData() throws Exception {
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + token("23110149")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lessons.length()").value(2))
                .andExpect(jsonPath("$.questions.length()").value(3))
                .andExpect(jsonPath("$.feedback.length()").value(1))
                .andExpect(jsonPath("$.notices.length()").value(3));
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + token("GV001")))
                .andExpect(jsonPath("$.lessons.length()").value(3))
                .andExpect(jsonPath("$.coordination.items.length()").value(9));
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + token("AD001")))
                .andExpect(jsonPath("$.admin.users.length()").value(6))
                .andExpect(jsonPath("$.admin.classes.length()").value(4));
        token("TK001");
        token("TN001");
    }

    @Test
    void e2eResetRestoresTheDemoData() throws Exception {
        String admin = token("AD001");
        mvc.perform(post("/api/notices").header("Authorization", "Bearer " + admin).contentType("application/json")
                .content(mapper.writeValueAsString(Map.of("audience", "student", "message", "Thêm")))).andExpect(status().isCreated());
        mvc.perform(post("/api/e2e/reset").header("Authorization", "Bearer " + token("23110149"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/e2e/reset").header("Authorization", "Bearer " + admin)).andExpect(status().isNoContent());
        mvc.perform(get("/api/bootstrap").header("Authorization", "Bearer " + token("23110149")))
                .andExpect(jsonPath("$.notices.length()").value(3));
    }

    @Test
    void seededPdfIsIndexedForTheAssistant() throws Exception {
        mvc.perform(get("/api/materials").param("classId", "CSE301.01").header("Authorization", "Bearer " + token("GV001")))
                .andExpect(jsonPath("$[0].indexStatus").value("ready"));
    }
}
