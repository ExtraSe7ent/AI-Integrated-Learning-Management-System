package vn.edu.vju.lms.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IAssessmentDao;

class AssessmentDeadlineRestTest extends AbstractApiTest {
    @Autowired
    private IAssessmentDao assessmentDao;

    private String expiredDraft() throws Exception {
        String id = "deadline-" + UUID.randomUUID();
        mvc.perform(post("/api/assignments").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                "classId", vn.edu.vju.lms.security.TeachingScope.DEFAULT_CLASS, "id", id, "title", "Deadline test", "minutes", 10, "attempts", 2,
                "opens", "2020-01-01T00:00", "closes", "2099-01-01T00:00", "published", true,
                "questions", List.of(Map.of("type", "choice", "text", "Question",
                        "options", List.of("Wrong", "Right"), "correct", "1", "points", 10))))))
                .andExpect(status().isCreated());
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("draft", Map.of("answers", List.of("0"))))))
                .andExpect(status().isOk());
        tx.executeWithoutResult(s -> assessmentDao.find(STUDENT, id).orElseThrow()
                .setDraftDeadline(Instant.now().minusSeconds(1).toEpochMilli()));
        return id;
    }

    @Test
    void lateAutosaveFinalizesSavedAnswersInsteadOfAcceptingNewOnes() throws Exception {
        String id = expiredDraft();
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("draft", Map.of("answers", List.of("1"))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.draft").isEmpty())
                .andExpect(jsonPath("$.result.answers[0]").value("0"))
                .andExpect(jsonPath("$.result.score").value(0.0));
    }

    @Test
    void lateSubmissionUsesOnlyLastSavedAnswers() throws Exception {
        String id = expiredDraft();
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("result", Map.of("answers", List.of("1"))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.answers[0]").value("0"))
                .andExpect(jsonPath("$.result.score").value(0.0));
    }

    @Test
    void studentReloadFinalizesExpiredDraftOnlyOnce() throws Exception {
        String id = expiredDraft();
        for (int i = 0; i < 2; i++) {
            mvc.perform(get("/api/assessments").headers(auth(STUDENT)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$['" + id + "'].attempts").value(1))
                    .andExpect(jsonPath("$['" + id + "'].result.answers[0]").value("0"));
        }
    }

    @Test
    void teacherCanSeeExpiredDraftAfterStudentClosedBrowser() throws Exception {
        String id = expiredDraft();
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].attempts").value(1))
                .andExpect(jsonPath("$[0].result.answers[0]").value("0"));
    }
}
