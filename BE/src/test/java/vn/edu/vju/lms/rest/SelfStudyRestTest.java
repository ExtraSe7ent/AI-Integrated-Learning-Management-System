package vn.edu.vju.lms.rest;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.entity.Lesson;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.entity.StudySession;

/** Phase 3, 5 and 7 rules: server-checked self-study, quiz keys, shuffled exams and feedback evidence. */
class SelfStudyRestTest extends AbstractApiTest {

    @Autowired
    private IQuestionDao questionDao;

    @Autowired
    private IStudySessionDao sessionDao;

    @Autowired
    private IAssignmentDao assignmentDao;

    private static String id(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** A class with STUDENT and OTHER_STUDENT, a two-page lesson with a quiz on page 1, and one session. */
    private record Fixture(String classId, String lessonId, String questionId, String sessionId) {
    }

    private Fixture fixture(String opens, String closes, boolean late) {
        String classId = id("SS");
        String lessonId = id("bai");
        String questionId = id("cau");
        String sessionId = id("phien");
        tx.executeWithoutResult(s -> {
            ClassInfo info = new ClassInfo();
            info.setId(classId);
            info.setCourseId("cs301");
            info.setName(classId);
            info.setTerm("I");
            info.setYear("2026–2027");
            info.setRound("7");
            info.setTeacherId(LECTURER);
            info.setStudentIds(new ArrayList<>(List.of(STUDENT, OTHER_STUDENT)));
            classDao.persist(info);
            Lesson lesson = new Lesson();
            lesson.setId(lessonId);
            lesson.setClassId(classId);
            lesson.setTitle("Bài tự học");
            lesson.setOrder(1);
            lesson.setPublished(true);
            lesson.setSlides(List.of("Trang 1", "Trang 2"));
            lessonDao.persist(lesson);
            Question question = new Question();
            question.setId(questionId);
            question.setLessonId(lessonId);
            question.setText("URI dùng để làm gì?");
            question.setOptions(List.of("Định danh tài nguyên", "Mã hóa", "Nén", "Ghi log"));
            question.setCorrect(0);
            question.setExplanation("URI định danh tài nguyên.");
            question.setPage(1);
            question.setApproved(true);
            questionDao.persist(question);
            StudySession session = new StudySession();
            session.setId(sessionId);
            session.setLessonId(lessonId);
            session.setTitle("Phiên tự học");
            session.setOpens(opens);
            session.setCloses(closes);
            session.setPublished(true);
            session.setLate(late);
            sessionDao.persist(session);
        });
        return new Fixture(classId, lessonId, questionId, sessionId);
    }

    private Map<String, Object> progress(int page, String completedAt) {
        Map<String, Object> body = new HashMap<>();
        body.put("progress", page);
        body.put("answers", Map.of());
        body.put("completedAt", completedAt);
        return body;
    }

    @Test
    void progressIsDecidedByTheServer() throws Exception {
        Fixture f = fixture("2020-01-01T00:00", "2099-01-01T00:00", false);
        String url = "/api/study-progress/" + f.sessionId();
        // BR-09: the quiz of page 1 must be answered before the page counts as done.
        mvc.perform(put(url).headers(auth(STUDENT)).contentType(JSON).content(json(progress(1, null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cần trả lời câu hỏi của trang 1 trước khi tiếp tục."));
        // The key stays hidden until the student answers on the server.
        mvc.perform(get("/api/questions/" + f.questionId()).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.correct").doesNotExist())
                .andExpect(jsonPath("$.explanation").doesNotExist());
        mvc.perform(post(url + "/answers").headers(auth(STUDENT)).contentType(JSON)
                        .content(json(Map.of("questionId", f.questionId(), "choice", 2))))
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.correctIndex").value(0))
                .andExpect(jsonPath("$.explanation").value("URI định danh tài nguyên."));
        // AF-1: the first (wrong) answer is what counts.
        mvc.perform(post(url + "/answers").headers(auth(STUDENT)).contentType(JSON)
                        .content(json(Map.of("questionId", f.questionId(), "choice", 0))))
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.progress.answers." + f.questionId()).value(2));
        mvc.perform(get("/api/questions/" + f.questionId()).headers(auth(STUDENT))).andExpect(jsonPath("$.correct").value(0));
        mvc.perform(get("/api/questions/" + f.questionId()).headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$.correct").doesNotExist());
        mvc.perform(post(url + "/answers").headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("questionId", f.questionId(), "choice", 9)))).andExpect(status().isBadRequest());
        mvc.perform(post(url + "/answers").headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("questionId", "khong-co", "choice", 0)))).andExpect(status().isNotFound());
        mvc.perform(post(url + "/answers").headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("questionId", f.questionId())))).andExpect(status().isBadRequest());

        // A completion date sent by the browser is ignored; it is stamped when the last page is reached.
        mvc.perform(put(url).headers(auth(STUDENT)).contentType(JSON).content(json(progress(1, "2020-01-02T00:00:00Z"))))
                .andExpect(jsonPath("$.progress").value(1))
                .andExpect(jsonPath("$.completedAt").doesNotExist());
        mvc.perform(put(url).headers(auth(STUDENT)).contentType(JSON).content(json(progress(9, null))))
                .andExpect(jsonPath("$.progress").value(2))
                .andExpect(jsonPath("$.completedAt").value(containsString("T")));
        // AF-2: reviewing a finished session changes nothing.
        mvc.perform(put(url).headers(auth(STUDENT)).contentType(JSON).content(json(progress(0, null))))
                .andExpect(jsonPath("$.progress").value(2));

        Map<String, Object> withAnswer = progress(1, null);
        withAnswer.put("answers", Map.of(f.questionId(), 0, "la", 1));
        mvc.perform(put(url).headers(auth(OTHER_STUDENT)).contentType(JSON).content(json(withAnswer)))
                .andExpect(jsonPath("$.progress").value(1))
                .andExpect(jsonPath("$.answers.la").doesNotExist());
        mvc.perform(get("/api/study-progress").headers(auth(OTHER_STUDENT)))
                .andExpect(jsonPath("$['" + f.sessionId() + "'].progress").value(1));
        mvc.perform(get("/api/study-progress").headers(auth(LECTURER)))
                .andExpect(jsonPath("$['" + f.sessionId() + "'].progress").value(2));
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(progress(1, null)))).andExpect(status().isForbidden());
        mvc.perform(put("/api/study-progress/khong-co").headers(auth(STUDENT)).contentType(JSON).content(json(progress(1, null))))
                .andExpect(status().isNotFound());
    }

    @Test
    void theSessionWindowAndEnrollmentAreEnforced() throws Exception {
        Fixture upcoming = fixture("2099-01-01T00:00", "2099-02-01T00:00", false);
        mvc.perform(put("/api/study-progress/" + upcoming.sessionId()).headers(auth(STUDENT)).contentType(JSON)
                        .content(json(progress(1, null))))
                .andExpect(jsonPath("$.message").value("Phiên tự học chưa mở."));
        Fixture expired = fixture("2020-01-01T00:00", "2020-02-01T00:00", false);
        mvc.perform(put("/api/study-progress/" + expired.sessionId()).headers(auth(STUDENT)).contentType(JSON)
                        .content(json(progress(1, null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("đã hết hạn")));
        Fixture late = fixture("2020-01-01T00:00", "2020-02-01T00:00", true);
        mvc.perform(post("/api/study-progress/" + late.sessionId() + "/answers").headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("questionId", late.questionId(), "choice", 0)))).andExpect(jsonPath("$.correct").value(true));
        mvc.perform(put("/api/study-progress/" + late.sessionId()).headers(auth(STUDENT)).contentType(JSON)
                .content(json(progress(2, null)))).andExpect(jsonPath("$.completedAt").exists());
        // Not enrolled in the class of the session's lesson.
        Fixture other = fixture("2020-01-01T00:00", "2099-01-01T00:00", false);
        tx.executeWithoutResult(s -> classDao.findById(other.classId()).orElseThrow().setStudentIds(new ArrayList<>()));
        mvc.perform(put("/api/study-progress/" + other.sessionId()).headers(auth(STUDENT)).contentType(JSON)
                .content(json(progress(1, null)))).andExpect(status().isForbidden());
        // Unpublished sessions do not exist for students.
        tx.executeWithoutResult(s -> sessionDao.findById(upcoming.sessionId()).orElseThrow().setPublished(false));
        mvc.perform(put("/api/study-progress/" + upcoming.sessionId()).headers(auth(STUDENT)).contentType(JSON)
                .content(json(progress(1, null)))).andExpect(status().isNotFound());
        // A session whose lesson is gone cannot be studied.
        tx.executeWithoutResult(s -> sessionDao.findById(other.sessionId()).orElseThrow().setLessonId("khong-co"));
        mvc.perform(put("/api/study-progress/" + other.sessionId()).headers(auth(STUDENT)).contentType(JSON)
                .content(json(progress(1, null)))).andExpect(status().isBadRequest());
    }

    // UC-A03 AF-1: shuffled exams

    private String exam(boolean random) {
        Assignment assignment = new Assignment();
        assignment.setClassId(vn.edu.vju.lms.security.TeachingScope.DEFAULT_CLASS);
        assignment.setId(id("de"));
        assignment.setTitle("Đề ngẫu nhiên");
        assignment.setMinutes(10);
        assignment.setOpens("2020-01-01T00:00");
        assignment.setCloses("2099-01-01T00:00");
        assignment.setPublished(true);
        assignment.setAttempts(2);
        assignment.setRandom(random);
        List<ExamQuestion> questions = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            questions.add(new ExamQuestion(ExamQuestion.BLANK, "Câu " + i, null, "dap" + i, 1.0, "Giải thích " + i));
        }
        assignment.setQuestions(questions);
        tx.executeWithoutResult(s -> assignmentDao.persist(assignment));
        return assignment.getId();
    }

    private List<String> shownTitles(String user, String examId) throws Exception {
        String body = mvc.perform(get("/api/assignments/" + examId).headers(auth(user))).andReturn().getResponse()
                .getContentAsString();
        List<String> titles = new ArrayList<>();
        mapper.readTree(body).path("questions").forEach(q -> titles.add(q.path("text").asText()));
        return titles;
    }

    @Test
    void randomExamsShowEachStudentTheirOwnOrderButGradeTheOriginal() throws Exception {
        String examId = exam(true);
        List<String> mine = shownTitles(STUDENT, examId);
        org.assertj.core.api.Assertions.assertThat(mine).hasSize(8).containsExactlyInAnyOrder(
                "Câu 0", "Câu 1", "Câu 2", "Câu 3", "Câu 4", "Câu 5", "Câu 6", "Câu 7");
        org.assertj.core.api.Assertions.assertThat(shownTitles(STUDENT, examId)).isEqualTo(mine);
        org.assertj.core.api.Assertions.assertThat(shownTitles(LECTURER, examId)).containsExactly(
                "Câu 0", "Câu 1", "Câu 2", "Câu 3", "Câu 4", "Câu 5", "Câu 6", "Câu 7");
        // The student answers in their own order: the right answer for "Câu k" is "dapk".
        List<String> answers = mine.stream().map(title -> "dap" + title.substring(4)).toList();
        Map<String, Object> draft = new HashMap<>();
        draft.put("draft", Map.of("answers", answers));
        mvc.perform(put("/api/assessments/" + examId).headers(auth(STUDENT)).contentType(JSON).content(json(draft)))
                .andExpect(jsonPath("$.draft.answers[0]").value(answers.get(0)));
        mvc.perform(put("/api/assessments/" + examId).headers(auth(STUDENT)).contentType(JSON)
                        .content(json(Map.of("result", Map.of("answers", answers)))))
                .andExpect(jsonPath("$.result.score").value(8.0))
                .andExpect(jsonPath("$.result.answers[0]").value(answers.get(0)));
        mvc.perform(get("/api/assessments/" + examId + "/submissions").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[0].result.answers[0]").value("dap0"));
        // An appeal on the student's question 1 is stored against the original question.
        int original = Integer.parseInt(mine.get(0).substring(4));
        mvc.perform(post("/api/appeals").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of(
                        "assignmentId", examId, "questionIndex", 0, "question", mine.get(0), "answer", answers.get(0),
                        "previousPoints", 1, "maxPoints", 1, "reason", "Xin xem lại câu này giúp em", "status", "pending"))))
                .andExpect(jsonPath("$.questionIndex").value(0));
        mvc.perform(get("/api/appeals").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[?(@.assignmentId=='" + examId + "')].questionIndex").value(original));
    }

    @Test
    void fixedExamsKeepTheirOrder() throws Exception {
        String examId = exam(false);
        org.assertj.core.api.Assertions.assertThat(shownTitles(STUDENT, examId)).containsExactly(
                "Câu 0", "Câu 1", "Câu 2", "Câu 3", "Câu 4", "Câu 5", "Câu 6", "Câu 7");
    }

    // UC-E01/E02: evidence images on the server

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 0, 0, 0, 13};

    private MockMultipartFile image(String name, byte[] bytes) {
        return new MockMultipartFile("files", name, "image/png", bytes);
    }

    @Test
    void feedbackImagesAreStoredOnTheServerForTheLecturer() throws Exception {
        mvc.perform(multipart("/api/feedback-images").file(image("a.txt", "not an image".getBytes())).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.message").value(containsString("Chỉ chấp nhận tệp hình ảnh")));
        var six = multipart("/api/feedback-images");
        for (int i = 0; i < 6; i++) {
            six.file(image(i + ".png", PNG));
        }
        mvc.perform(six.headers(auth(STUDENT))).andExpect(jsonPath("$.message").value("Chọn tối đa 5 ảnh."));
        mvc.perform(multipart("/api/feedback-images").file(image("big.png", new byte[6 * 1024 * 1024])).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.message").value("Tổng dung lượng ảnh không được vượt quá 5 MB."));
        byte[] jpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1};
        byte[] gif = {'G', 'I', 'F', '8', '9', 'a'};
        byte[] webp = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};
        String body = mvc.perform(multipart("/api/feedback-images").file(image("loi.png", PNG)).file(image("b.jpg", jpeg))
                        .file(image("c.gif", gif)).file(image("d.webp", webp)).headers(auth(STUDENT)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(4)))
                .andReturn().getResponse().getContentAsString();
        String imageId = mapper.readTree(body).path(0).asText();
        var async = mvc.perform(get("/api/feedback-images/" + imageId).headers(auth(LECTURER))).andExpect(request().asyncStarted()).andReturn();
        mvc.perform(asyncDispatch(async)).andExpect(status().isOk()).andExpect(content().bytes(PNG));
        mvc.perform(get("/api/feedback-images/" + imageId).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/feedback-images/khong-co").headers(auth(LECTURER))).andExpect(status().isNotFound());

        Map<String, Object> feedback = new HashMap<>();
        feedback.put("id", id("ph"));
        feedback.put("course", "cs301");
        feedback.put("lesson", "Bài 1");
        feedback.put("category", "Bài giảng");
        feedback.put("body", "Slide trang 3 sai mã trạng thái");
        feedback.put("images", List.of("loi.png"));
        feedback.put("imageIds", List.of(imageId));
        feedback.put("resolved", false);
        // Another student cannot attach someone else's image.
        mvc.perform(post("/api/feedback").headers(auth(OTHER_STUDENT)).contentType(JSON).content(json(feedback)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/feedback").headers(auth(STUDENT)).contentType(JSON).content(json(feedback)))
                .andExpect(status().isCreated());
        feedback.put("imageIds", List.of(imageId, "khong-co"));
        mvc.perform(put("/api/feedback/" + feedback.get("id")).headers(auth(STUDENT)).contentType(JSON).content(json(feedback)))
                .andExpect(status().isBadRequest());
        feedback.put("imageIds", List.of("1", "2", "3", "4", "5", "6"));
        feedback.put("id", id("ph"));
        mvc.perform(post("/api/feedback").headers(auth(STUDENT)).contentType(JSON).content(json(feedback)))
                .andExpect(jsonPath("$.message").value("Chọn tối đa 5 ảnh."));
        mvc.perform(multipart("/api/feedback-images").headers(auth(STUDENT))).andExpect(status().isBadRequest());
    }

    // UC-F01 b, c

    @Test
    void dashboardShowsCorrectRateLastSubmissionAndFeedback() throws Exception {
        String classId = id("DB");
        String student = "db" + UUID.randomUUID().toString().substring(0, 10);
        tx.executeWithoutResult(s -> {
            vn.edu.vju.lms.entity.UserAccount user = new vn.edu.vju.lms.entity.UserAccount();
            user.setId(student);
            user.setName("Sinh viên dashboard");
            user.setEmail(student + "@example.edu");
            user.setEmailHash(aesService.blindIndex(user.getEmail()));
            user.setKind("student");
            user.setRole(vn.edu.vju.lms.security.Role.STUDENT);
            user.setPasswordHash(passwordEncoder.encode(PASSWORD));
            userDao.persist(user);
            ClassInfo info = new ClassInfo();
            info.setId(classId);
            info.setCourseId("cs301");
            info.setName(classId);
            info.setTerm("I");
            info.setYear("2026–2027");
            info.setRound("8");
            info.setTeacherId(LECTURER);
            info.setStudentIds(new ArrayList<>(List.of(student)));
            classDao.persist(info);
        });
        String row = "$.classes[?(@.id=='" + classId + "')].students[0]";
        mvc.perform(get("/api/analytics").headers(auth(LECTURER)))
                .andExpect(jsonPath(row + ".correctRate").isEmpty())
                .andExpect(jsonPath(row + ".feedback").value(0));
        String examId = exam(false);
        tx.executeWithoutResult(s->assignmentDao.findById(examId).orElseThrow().setClassId(classId));
        Map<String, Object> draft = new HashMap<>();
        draft.put("draft", Map.of("answers", List.of("", "", "", "", "", "", "", "")));
        mvc.perform(put("/api/assessments/" + examId).headers(auth(student)).contentType(JSON).content(json(draft)));
        List<String> half = List.of("dap0", "dap1", "dap2", "dap3", "x", "x", "x", "x");
        mvc.perform(put("/api/assessments/" + examId).headers(auth(student)).contentType(JSON)
                .content(json(Map.of("result", Map.of("answers", half))))).andExpect(status().isOk());
        Map<String, Object> feedback = new HashMap<>();
        feedback.put("id", id("ph"));
        feedback.put("body", "Góp ý");
        feedback.put("course", "cs301");
        feedback.put("lesson", "Bài 1");
        feedback.put("category", "Khác");
        feedback.put("images", List.of());
        feedback.put("imageIds", List.of());
        feedback.put("resolved", false);
        mvc.perform(post("/api/feedback").headers(auth(student)).contentType(JSON).content(json(feedback))).andExpect(status().isCreated());
        mvc.perform(get("/api/analytics").headers(auth(LECTURER)))
                .andExpect(jsonPath(row + ".correctRate").value(50))
                .andExpect(jsonPath(row + ".lastSubmitted").isNotEmpty())
                .andExpect(jsonPath(row + ".feedback").value(1));
        tx.executeWithoutResult(s -> assignmentDao.findById(examId).orElseThrow().setPublished(false));
    }
}
