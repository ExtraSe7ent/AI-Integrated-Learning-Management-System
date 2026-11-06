package vn.edu.vju.lms.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Course;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;

class ExamAndAnalyticsRestTest extends AbstractApiTest {

    @Autowired
    private vn.edu.vju.lms.dao.IStudySessionDao sessionDao;

    private static Map<String, Object> choice(double points) {
        return new HashMap<>(Map.of("type", "choice", "text", "Câu A", "options", List.of("Sai", "Đúng"), "correct", "1",
                "points", points, "explanation", "Vì đúng"));
    }

    private static Map<String, Object> blank(double points) {
        return new HashMap<>(Map.of("type", "blank", "text", "Điền", "correct", "GET|Lấy", "points", points));
    }

    private static Map<String, Object> essay(double points) {
        return new HashMap<>(Map.of("type", "essay", "text", "Viết", "points", points,
                "correct", "Nêu endpoint = endpoint|uri; Nêu lý do = vì"));
    }

    private Map<String, Object> assignment(List<Map<String, Object>> questions) {
        Map<String, Object> body = new HashMap<>();
        body.put("id", "exam-" + UUID.randomUUID());
        body.put("title", "Đề cấu hình");
        body.put("minutes", 30);
        body.put("opens", "2020-01-01T00:00");
        body.put("closes", "2099-01-01T00:00");
        body.put("published", true);
        body.put("attempts", 2);
        body.put("questions", questions);
        return body;
    }

    private String createExam() throws Exception {
        Map<String, Object> body = assignment(List.of(choice(5), blank(3), essay(2)));
        mvc.perform(post("/api/assignments").headers(auth(LECTURER)).contentType(JSON).content(json(body)))
                .andExpect(status().isCreated());
        return (String) body.get("id");
    }

    private void submit(String id, String student, String... answers) throws Exception {
        Map<String, Object> draft = new HashMap<>();
        draft.put("draft", Map.of("answers", List.of("", "", "")));
        mvc.perform(put("/api/assessments/" + id).headers(auth(student)).contentType(JSON).content(json(draft)))
                .andExpect(status().isOk());
        Map<String, Object> submission = new HashMap<>();
        submission.put("result", Map.of("answers", List.of(answers)));
        mvc.perform(put("/api/assessments/" + id).headers(auth(student)).contentType(JSON).content(json(submission)))
                .andExpect(status().isOk());
    }

    private String badRequest(Map<String, Object> body) throws Exception {
        return mvc.perform(post("/api/assignments").headers(auth(LECTURER)).contentType(JSON).content(json(body)))
                .andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();
    }

    @Test
    void examStructureIsValidated() throws Exception {
        badRequest(assignment(List.of()));
        badRequest(assignment(List.of(choice(5), blank(3))));
        Map<String, Object> unknown = choice(10);
        unknown.put("type", "bai-van");
        badRequest(assignment(List.of(unknown)));
        Map<String, Object> noPoints = choice(10);
        noPoints.remove("points");
        badRequest(assignment(List.of(noPoints)));
        Map<String, Object> noKey = blank(10);
        noKey.remove("correct");
        badRequest(assignment(List.of(noKey)));
        Map<String, Object> outOfRange = choice(10);
        outOfRange.put("correct", "7");
        badRequest(assignment(List.of(outOfRange)));
        Map<String, Object> oneOption = choice(10);
        oneOption.put("options", List.of("Chỉ một"));
        badRequest(assignment(List.of(oneOption)));
    }

    @Test
    void studentCannotSeeTheAnswerKeyBeforeSubmitting() throws Exception {
        String id = createExam();
        String url = "/api/assignments/" + id;
        mvc.perform(get(url).headers(auth(LECTURER))).andExpect(jsonPath("$.questions[0].correct").value("1"));
        mvc.perform(get(url).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.questions", hasSize(3)))
                .andExpect(jsonPath("$.questions[0].text").value("Câu A"))
                .andExpect(jsonPath("$.questions[0].correct").doesNotExist())
                .andExpect(jsonPath("$.questions[0].explanation").doesNotExist())
                .andExpect(jsonPath("$.questions[1].correct").doesNotExist());
        mvc.perform(get("/api/bootstrap").headers(auth(STUDENT)))
                .andExpect(jsonPath("$.assignments[?(@.id=='" + id + "')].questions[0].correct").isEmpty());

        submit(id, STUDENT, "1", "get", "endpoint /a vì đúng");
        mvc.perform(get(url).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.questions[0].correct").value("1"))
                .andExpect(jsonPath("$.questions[0].explanation").value("Vì đúng"))
                .andExpect(jsonPath("$.questions[2].correct").doesNotExist());
        mvc.perform(get(url).headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$.questions[0].correct").doesNotExist());
    }

    @Test
    void configuredExamIsGradedByItsOwnKey() throws Exception {
        String id = createExam();
        submit(id, STUDENT, "1", " LẤY ", "bài viết");
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentName").value("Người dùng " + STUDENT))
                .andExpect(jsonPath("$[0].result.score").value(8.0))
                .andExpect(jsonPath("$[0].result.questionPoints[2]").value(0.0));
    }

    @Test
    void eachSubmissionIsListedAndGradedSeparately() throws Exception {
        String id = createExam();
        submit(id, STUDENT, "1", "GET", "");
        submit(id, OTHER_STUDENT, "0", "x", "");
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(2)));
        Map<String, Object> grade = new HashMap<>();
        grade.put("studentId", OTHER_STUDENT);
        grade.put("result", Map.of("questionPoints", List.of(0, 0, 2), "approved", true));
        mvc.perform(put("/api/assessments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(grade)))
                .andExpect(jsonPath("$.result.score").value(2.0));
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[?(@.studentId=='" + STUDENT + "')].result.score").value(8.0));
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(STUDENT))).andExpect(status().isForbidden());
    }

    @Test
    void essayDraftFollowsTheRubricWithoutSavingPoints() throws Exception {
        String id = createExam();
        submit(id, STUDENT, "1", "GET", "Em chọn endpoint /books");
        String url = "/api/assessments/" + id + "/essay-drafts";
        mvc.perform(post(url).param("studentId", STUDENT).headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].questionIndex").value(2))
                .andExpect(jsonPath("$[0].points").value(1.0))
                .andExpect(jsonPath("$[0].mode").value("rubric"))
                .andExpect(jsonPath("$[0].feedback").value("Cần bổ sung: Nêu lý do."));
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[0].result.score").value(8.0));
        mvc.perform(post(url).param("studentId", OTHER_STUDENT).headers(auth(LECTURER))).andExpect(status().isNotFound());
        mvc.perform(post(url).param("studentId", STUDENT).headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(post("/api/assessments/khong-co/essay-drafts").param("studentId", STUDENT).headers(auth(LECTURER)))
                .andExpect(status().isNotFound());
    }

    @Test
    void acceptedAppealChangesOnlyTheOwnersScore() throws Exception {
        String id = createExam();
        submit(id, STUDENT, "0", "GET", "");
        submit(id, OTHER_STUDENT, "0", "GET", "");
        String appeal = "ap-" + UUID.randomUUID();
        mvc.perform(post("/api/appeals").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of(
                "id", appeal, "assignmentId", id, "questionIndex", 0, "reason", "Xin chấm lại câu 1"))))
                .andExpect(status().isCreated());

        Map<String, Object> tooHigh = new HashMap<>(Map.of("status", "accepted", "grade", 9));
        mvc.perform(put("/api/appeals/" + appeal).headers(auth(LECTURER)).contentType(JSON).content(json(tooHigh)))
                .andExpect(status().isBadRequest());

        Map<String, Object> decision = new HashMap<>(Map.of("status", "accepted", "grade", 4, "response", "Chấm lại"));
        mvc.perform(put("/api/appeals/" + appeal).headers(auth(LECTURER)).contentType(JSON).content(json(decision)))
                .andExpect(jsonPath("$.status").value("accepted"));
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[?(@.studentId=='" + STUDENT + "')].result.score").value(7.0))
                .andExpect(jsonPath("$[?(@.studentId=='" + STUDENT + "')].result.approved").value(true))
                .andExpect(jsonPath("$[?(@.studentId=='" + OTHER_STUDENT + "')].result.score").value(3.0));

        mvc.perform(put("/api/appeals/" + appeal).headers(auth(LECTURER)).contentType(JSON).content(json(decision)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/assessments/" + id + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[?(@.studentId=='" + STUDENT + "')].result.score").value(7.0));
    }

    @Test
    void questionsLockOnceAnExamHasSubmissions() throws Exception {
        String id = createExam();
        Map<String, Object> change = new HashMap<>(Map.of("questions", List.of(choice(10))));
        mvc.perform(put("/api/assignments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(change)))
                .andExpect(jsonPath("$.questions", hasSize(1)));
        mvc.perform(put("/api/assignments/" + id).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("questions", List.of(choice(5), blank(3), essay(2))))))
                .andExpect(status().isOk());
        submit(id, STUDENT, "1", "GET", "");
        mvc.perform(put("/api/assignments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(change)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Đề đã có bài nộp nên không thể sửa câu hỏi."));
        mvc.perform(put("/api/assignments/" + id).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("title", "Tên mới"))))
                .andExpect(jsonPath("$.title").value("Tên mới"));
    }

    private ClassInfo classOf(String teacher, String leader, String... students) {
        String courseId = "ana-" + UUID.randomUUID();
        Course course = new Course();
        course.setId(courseId);
        course.setCode("ANA101");
        course.setTitle("Phân tích");
        course.setFaculty("CNTT");
        ClassInfo info = new ClassInfo();
        info.setId("c-" + UUID.randomUUID().toString().substring(0, 30));
        info.setCourseId(courseId);
        info.setName(info.getId());
        info.setTeacherId(teacher);
        info.setLeaderId(leader);
        info.setStudentIds(new ArrayList<>(List.of(students)));
        tx.executeWithoutResult(s -> {
            courseDao.persist(course);
            classDao.persist(info);
        });
        return info;
    }

    private String row(String classId) {
        return "$.classes[?(@.id=='" + classId + "')]";
    }

    @Test
    void reportsAreScopedToTheCallersClasses() throws Exception {
        ClassInfo own = classOf(LECTURER, LEADER, STUDENT);
        ClassInfo other = classOf("GV-KHAC", "TN-KHAC", OTHER_STUDENT);
        for (String user : List.of(LECTURER, LEADER)) {
            mvc.perform(get("/api/analytics").headers(auth(user)))
                    .andExpect(jsonPath(row(own.getId()) + ".courseCode").value("ANA101"))
                    .andExpect(jsonPath(row(other.getId())).isEmpty());
        }
        for (String user : List.of(DEAN, ADMIN)) {
            mvc.perform(get("/api/analytics").headers(auth(user)))
                    .andExpect(jsonPath(row(own.getId()) + ".teacher").value("Người dùng " + LECTURER))
                    .andExpect(jsonPath(row(other.getId()) + ".teacher").value(""));
        }
        mvc.perform(get("/api/analytics").headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/bootstrap").headers(auth(STUDENT)))
                .andExpect(jsonPath("$.analytics.classes", hasSize(0)));
    }

    private String newStudent() {
        UserAccount user = new UserAccount();
        user.setId("av" + UUID.randomUUID().toString().substring(0, 20));
        user.setName("Sinh viên phân tích");
        user.setEmail(user.getId() + "@example.edu");
        user.setEmailHash(aesService.blindIndex(user.getEmail()));
        user.setKind("student");
        user.setRole(Role.STUDENT);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        tx.executeWithoutResult(s -> userDao.persist(user));
        return user.getId();
    }

    @Test
    void averageComesFromSubmittedPublishedAssignments() throws Exception {
        String student = newStudent();
        String first = createExam();
        String second = createExam();
        submit(first, student, "1", "GET", "");
        submit(second, student, "1", "x", "");
        ClassInfo info = classOf(LECTURER, LEADER, student);
        String row = row(info.getId()) + ".students[0]";
        mvc.perform(get("/api/analytics").headers(auth(LECTURER)))
                .andExpect(jsonPath(row + ".id").value(student))
                .andExpect(jsonPath(row + ".email").value(student + "@example.edu"))
                .andExpect(jsonPath(row + ".average").value(6.5))
                .andExpect(jsonPath(row + ".submitted").value(2))
                .andExpect(jsonPath(row + ".chats").value(0));
        mvc.perform(put("/api/assignments/" + second).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("published", false))))
                .andExpect(jsonPath("$.published").value(false));
        mvc.perform(get("/api/analytics").headers(auth(LECTURER)))
                .andExpect(jsonPath(row + ".average").value(8.0))
                .andExpect(jsonPath(row + ".submitted").value(1));
    }

    @Test
    void selfStudyCountsOnlySessionsFinishedOnTime() throws Exception {
        String student = newStudent();
        ClassInfo info = classOf(LECTURER, LEADER, student);
        String lessonId = "ana-l-" + UUID.randomUUID();
        tx.executeWithoutResult(s -> {
            vn.edu.vju.lms.entity.Lesson lesson = new vn.edu.vju.lms.entity.Lesson();
            lesson.setId(lessonId);
            lesson.setClassId(info.getId());
            lesson.setTitle("Bài phân tích");
            lesson.setOrder(1);
            lesson.setPublished(true);
            lesson.setSlides(List.of("Trang 1", "Trang 2"));
            lessonDao.persist(lesson);
        });
        String onTime = "st-" + UUID.randomUUID();
        String late = "st-" + UUID.randomUUID();
        // The late session already closed but allows late study: finishing it now is after its deadline.
        for (String[] session : List.of(new String[] {onTime, "2099-01-01T00:00", "false"}, new String[] {late, "2020-01-01T00:00", "true"})) {
            mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of(
                    "id", session[0], "title", "Phiên", "lessonId", lessonId, "opens", "2019-01-01T00:00",
                    "closes", session[1], "published", true, "late", Boolean.parseBoolean(session[2])))))
                    .andExpect(status().isCreated());
        }
        Map<String, Object> done = new HashMap<>();
        done.put("progress", 2);
        done.put("answers", Map.of());
        done.put("completedAt", "2019-06-01T00:00:00Z");
        for (String session : List.of(onTime, late)) {
            mvc.perform(put("/api/study-progress/" + session).headers(auth(student)).contentType(JSON).content(json(done)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.completedAt").value(org.hamcrest.Matchers.not("2019-06-01T00:00:00Z")));
        }
        String body = mvc.perform(get("/api/analytics").headers(auth(LECTURER)))
                .andReturn().getResponse().getContentAsString();
        double total = com.jayway.jsonpath.JsonPath.<List<Double>>read(body, row(info.getId()) + ".students[0].selfStudy").get(0);
        int sessions = (int) sessionCount();
        org.assertj.core.api.Assertions.assertThat(total).isEqualTo(Math.round(10.0 / sessions * 10) / 10.0);
        tx.executeWithoutResult(s -> sessionDao.findAll().stream()
                .filter(x -> onTime.equals(x.getId()) || late.equals(x.getId())).forEach(x -> x.setPublished(false)));
    }

    private long sessionCount() {
        return tx.execute(s -> sessionDao.findAll().stream().filter(x -> Boolean.TRUE.equals(x.getPublished())).count());
    }
}
