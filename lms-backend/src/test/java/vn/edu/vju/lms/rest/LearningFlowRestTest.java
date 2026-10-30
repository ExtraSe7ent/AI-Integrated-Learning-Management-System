package vn.edu.vju.lms.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.StudySession;

class LearningFlowRestTest extends AbstractApiTest {

    @Autowired
    private IAssignmentDao assignmentDao;

    @Autowired
    private IStudySessionDao sessionDao;

    private String assignment(String opens, String closes, int attempts, boolean published) {
        Assignment entity = new Assignment();
        entity.setId("a-" + UUID.randomUUID());
        entity.setTitle("Bài");
        entity.setMinutes(30);
        entity.setOpens(opens);
        entity.setCloses(closes);
        entity.setPublished(published);
        entity.setAttempts(attempts);
        tx.executeWithoutResult(s -> assignmentDao.persist(entity));
        return entity.getId();
    }

    private String openAssignment(int attempts) {
        return assignment("2020-01-01T00:00", "2099-01-01T00:00", attempts, true);
    }

    private Map<String, Object> draft(String... answers) {
        Map<String, Object> body = new HashMap<>();
        body.put("draft", Map.of("answers", List.of(answers), "deadline", 0));
        return body;
    }

    private Map<String, Object> submission(String... answers) {
        Map<String, Object> body = new HashMap<>();
        body.put("draft", null);
        body.put("result", Map.of("answers", Arrays.asList(answers), "score", 10));
        return body;
    }

    private void begin(String id, String student) throws Exception {
        mvc.perform(put("/api/assessments/" + id).headers(auth(student)).contentType(JSON).content(json(draft("", "", ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.draft.deadline").isNumber());
    }

    @Test
    void scoreIsComputedByServerNotTakenFromClient() throws Exception {
        String id = openAssignment(2);
        begin(id, STUDENT);
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(submission("0", " post ", "bài viết"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.score").value(7.0))
                .andExpect(jsonPath("$.result.questionPoints", hasSize(3)))
                .andExpect(jsonPath("$.attempts").value(1))
                .andExpect(jsonPath("$.draft").doesNotExist());
    }

    @Test
    void wrongAnswersScoreZero() throws Exception {
        String id = openAssignment(1);
        begin(id, STUDENT);
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(submission("1", "GET"))))
                .andExpect(jsonPath("$.result.score").value(0.0));
    }

    @Test
    void submitWithoutDraftChangesNothing() throws Exception {
        String id = openAssignment(1);
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(submission("0", "POST", ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempts").value(0))
                .andExpect(jsonPath("$.result").doesNotExist());
    }

    @Test
    void attemptsAreLimited() throws Exception {
        String id = openAssignment(1);
        begin(id, STUDENT);
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(submission("0", "x", ""))))
                .andExpect(status().isOk());
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(draft("", "", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Đã hết lượt làm bài."));
    }

    @Test
    void closedOrUnpublishedAssignmentCannotStart() throws Exception {
        for (String id : List.of(assignment("2020-01-01T00:00", "2021-01-01T00:00", 1, true),
                assignment("2098-01-01T00:00", "2099-01-01T00:00", 1, true),
                assignment("2020-01-01T00:00", "2099-01-01T00:00", 1, false))) {
            mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(draft("", "", ""))))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(put("/api/assessments/khong-co").headers(auth(STUDENT)).contentType(JSON).content(json(draft(""))))
                .andExpect(status().isNotFound());
    }

    @Test
    void lecturerGradesAndValidatesPoints() throws Exception {
        String id = openAssignment(2);
        begin(id, STUDENT);
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(submission("0", "POST", "essay"))))
                .andExpect(status().isOk());
        Map<String, Object> grade = new HashMap<>();
        grade.put("studentId", STUDENT);
        grade.put("result", Map.of("questionPoints", List.of(4, 3, 2.5), "approved", true, "comment", "Tốt"));
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(grade)))
                .andExpect(jsonPath("$.result.score").value(9.5))
                .andExpect(jsonPath("$.result.approved").value(true))
                .andExpect(jsonPath("$.result.comment").value("Tốt"));

        grade.put("result", Map.of("questionPoints", List.of(5, 3, 2)));
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(grade)))
                .andExpect(status().isBadRequest());
        grade.put("result", Map.of("questionPoints", List.of(1, 1)));
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(grade)))
                .andExpect(status().isBadRequest());
        grade.remove("result");
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(grade)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/assessments").headers(auth(LECTURER)))
                .andExpect(jsonPath("$['" + id + "'].studentId").value(STUDENT));
        grade.remove("studentId");
        grade.put("result", Map.of("comment", "Mới nhất"));
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(grade)))
                .andExpect(jsonPath("$.result.comment").value("Mới nhất"));
    }

    @Test
    void gradingNeedsASubmissionAndTheRightRole() throws Exception {
        String id = openAssignment(1);
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content("{}"))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/assessments/" + id).headers(auth(DEAN)).contentType(JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void pendingAppealBlocksNewAttemptUntilResolved() throws Exception {
        String id = openAssignment(3);
        begin(id, STUDENT);
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(submission("0", "x", ""))))
                .andExpect(status().isOk());
        String appeal = "ap-" + UUID.randomUUID();
        mvc.perform(post("/api/appeals").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of(
                "id", appeal, "assignmentId", id, "status", "accepted", "reason", "Xin chấm lại"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.ownerId").value(STUDENT));
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(draft("", "", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Chờ xử lý phúc khảo trước khi làm lại bài tập."));
        mvc.perform(put("/api/appeals/" + appeal).headers(auth(STUDENT)).contentType(JSON).content(json(Map.of("status", "accepted"))))
                .andExpect(jsonPath("$.status").value("pending"));
        mvc.perform(put("/api/appeals/" + appeal).headers(auth(OTHER_STUDENT)).contentType(JSON).content(json(Map.of("reason", "x"))))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/appeals/" + appeal).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(put("/api/appeals/" + appeal).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("status", "rejected", "response", "Giữ nguyên"))))
                .andExpect(jsonPath("$.status").value("rejected"));
        begin(id, STUDENT);
    }

    @Test
    void studyProgressBelongsToTheStudent() throws Exception {
        StudySession session = new StudySession();
        session.setId("s-" + UUID.randomUUID());
        session.setTitle("Phiên");
        tx.executeWithoutResult(s -> sessionDao.persist(session));
        Map<String, Object> body = new HashMap<>();
        body.put("progress", 2);
        body.put("answers", Map.of("q1", 0));
        body.put("completedAt", null);
        String url = "/api/study-progress/" + session.getId();
        mvc.perform(put(url).headers(auth(STUDENT)).contentType(JSON).content(json(body)))
                .andExpect(jsonPath("$.progress").value(2));
        body.put("progress", 1);
        mvc.perform(put(url).headers(auth(OTHER_STUDENT)).contentType(JSON).content(json(body))).andExpect(status().isOk());
        mvc.perform(get("/api/study-progress").headers(auth(OTHER_STUDENT)))
                .andExpect(jsonPath("$['" + session.getId() + "'].progress").value(1));
        mvc.perform(get("/api/study-progress").headers(auth(LECTURER)))
                .andExpect(jsonPath("$['" + session.getId() + "'].progress").value(2));
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(body))).andExpect(status().isForbidden());
        mvc.perform(put("/api/study-progress/khong-co").headers(auth(STUDENT)).contentType(JSON).content(json(body)))
                .andExpect(status().isNotFound());
    }

    @Test
    void sessionWindowIsValidated() throws Exception {
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                "title", "x", "opens", "2027-01-02T00:00", "closes", "2027-01-01T00:00"))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/assignments").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                "title", "x", "opens", "2027-01-02T00:00", "closes", "2027-01-01T00:00"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void questionNeedsValidCorrectIndex() throws Exception {
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                "text", "q", "options", List.of("A"), "correct", 3))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void attendanceAndScheduleRules() throws Exception {
        mvc.perform(post("/api/attendances").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                "classId", "c", "studentId", "s", "date", "2026-10-16", "status", "wrong"))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/schedules").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                "classId", "c", "dayOfWeek", "Friday", "startTime", "15:00", "endTime", "13:00"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validationErrorsAreReadable() throws Exception {
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content("{bad json"))
                .andExpect(status().isBadRequest());
    }
}
