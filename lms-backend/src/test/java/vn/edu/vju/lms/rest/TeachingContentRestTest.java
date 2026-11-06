package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.StudyProgress;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;

/** Business rules of Phase 1–2 that the generic CRUD tests do not reach: scope, validation and protection. */
class TeachingContentRestTest extends AbstractApiTest {

    private static final String OTHER_LECTURER = "GV-KHAC";

    @Autowired
    private IStudyProgressDao progressDao;

    @Autowired
    private IQuestionDao questionDao;

    @Autowired
    private IStudySessionDao sessionDao;

    private static String id(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private void otherLecturerWithClass(String classId) {
        tx.executeWithoutResult(s -> {
            if (userDao.findById(OTHER_LECTURER).isEmpty()) {
                UserAccount user = new UserAccount();
                user.setId(OTHER_LECTURER);
                user.setName("Giảng viên khác");
                user.setEmail("gv-khac@example.edu");
                user.setEmailHash(aesService.blindIndex(user.getEmail()));
                user.setFaculty("CNTT");
                user.setKind("teacher");
                user.setRole(Role.LECTURER);
                user.setPasswordHash(passwordEncoder.encode(PASSWORD));
                userDao.persist(user);
            }
            ClassInfo info = new ClassInfo();
            info.setId(classId);
            info.setCourseId("cs301");
            info.setName(classId);
            info.setTerm("I");
            info.setYear("2026–2027");
            info.setRound("2");
            info.setTeacherId(OTHER_LECTURER);
            info.setStudentIds(new ArrayList<>());
            classDao.persist(info);
        });
    }

    private Map<String, Object> lesson(String lessonId, String title) {
        Map<String, Object> body = new HashMap<>();
        body.put("id", lessonId);
        body.put("title", title);
        body.put("slides", List.of("Trang 1", "Trang 2", "Trang 3"));
        return body;
    }

    private String createLesson() throws Exception {
        String lessonId = id("bai");
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(lesson(lessonId, "Bài kiểm thử"))))
                .andExpect(status().isCreated());
        return lessonId;
    }

    private Map<String, Object> question(String lessonId, List<String> options, int correct, int page) {
        Map<String, Object> body = new HashMap<>();
        body.put("id", id("cau"));
        body.put("lessonId", lessonId);
        body.put("text", "REST định danh tài nguyên bằng gì?");
        body.put("options", options);
        body.put("correct", correct);
        body.put("explanation", "Bằng URI.");
        body.put("page", page);
        return body;
    }

    private static final List<String> ABCD = List.of("URI", "TCP", "Cookie", "SQL");

    private void studentStarted(String sessionId, Map<String, Integer> answers) {
        StudyProgress record = new StudyProgress();
        record.setId(id("tien-do"));
        record.setStudentId(STUDENT);
        record.setSessionId(sessionId);
        record.setProgress(answers.isEmpty() ? 1 : 0);
        record.setAnswers(answers);
        tx.executeWithoutResult(s -> progressDao.persist(record));
    }

    // UC-G02 Quản lý bài học

    @Test
    void lessonsAreValidatedAndScopedToTheirClass() throws Exception {
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(lesson(id("bai"), "  "))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(lesson(id("bai"), "x".repeat(121)))))
                .andExpect(status().isBadRequest());
        Map<String, Object> badSlides = lesson(id("bai"), "Bài");
        badSlides.put("slides", List.of("Trang 1", " "));
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(badSlides)))
                .andExpect(status().isBadRequest());
        Map<String, Object> zeroOrder = lesson(id("bai"), "Bài");
        zeroOrder.put("order", 0);
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(zeroOrder)))
                .andExpect(status().isBadRequest());
        Map<String, Object> noClass = lesson(id("bai"), "Bài");
        noClass.put("classId", "KHONG-CO");
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(noClass)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Lớp học phần không tồn tại: KHONG-CO"));

        // The client cannot claim "no student data"; the server decides.
        Map<String, Object> claimed = lesson(id("bai"), "Bài mới");
        claimed.put("activity", true);
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(claimed)))
                .andExpect(jsonPath("$.activity").value(false))
                .andExpect(jsonPath("$.published").value(false))
                .andExpect(jsonPath("$.classId").value("CSE301.01"));

        // Course leader of CSE301.01 is the secondary actor and may edit; a dean may not.
        mvc.perform(post("/api/lessons").headers(auth(LEADER)).contentType(JSON).content(json(lesson(id("bai"), "Bài của TNHP"))))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/lessons").headers(auth(DEAN)).contentType(JSON).content(json(lesson(id("bai"), "Bài"))))
                .andExpect(status().isForbidden());

        String foreignClass = id("LOP");
        otherLecturerWithClass(foreignClass);
        Map<String, Object> foreign = lesson(id("bai"), "Bài lớp khác");
        foreign.put("classId", foreignClass);
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(foreign)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/lessons").headers(auth(OTHER_LECTURER)).contentType(JSON).content(json(foreign)))
                .andExpect(status().isCreated());
        mvc.perform(put("/api/lessons/" + foreign.get("id")).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "Chiếm quyền")))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/lessons/" + foreign.get("id")).headers(auth(LECTURER))).andExpect(status().isForbidden());
        // Moving one's own lesson into someone else's class is refused too.
        String own = createLesson();
        mvc.perform(put("/api/lessons/" + own).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("classId", foreignClass)))).andExpect(status().isForbidden());
    }

    @Test
    void lessonVideoMustBeYouTube() throws Exception {
        String lessonId = createLesson();
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("video", "https://vimeo.com/123")))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("video", "https://youtu.be/dQw4w9WgXcQ"))))
                .andExpect(jsonPath("$.video").value("https://youtu.be/dQw4w9WgXcQ"));
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("video", ""))))
                .andExpect(status().isOk());
    }

    @Test
    void lessonKeepsItsWeekAndLecturePdf() throws Exception {
        String lessonId = createLesson();
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("week", 21)))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("week", 3, "materialId", "m-1", "pdfName", "bai-giang.pdf"))))
                .andExpect(jsonPath("$.week").value(3))
                .andExpect(jsonPath("$.materialId").value("m-1"))
                .andExpect(jsonPath("$.pdfName").value("bai-giang.pdf"));
        // Saving other fields leaves the PDF in place; an empty id removes it.
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("title", "Bài đổi tên"))))
                .andExpect(jsonPath("$.materialId").value("m-1"));
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("materialId", ""))))
                .andExpect(jsonPath("$.materialId").doesNotExist())
                .andExpect(jsonPath("$.pdfName").doesNotExist());
    }

    @Test
    void publishingNeedsEveryQuizApproved() throws Exception {
        String lessonId = createLesson();
        Map<String, Object> pending = question(lessonId, ABCD, 0, 1);
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(pending)))
                .andExpect(jsonPath("$.approved").value(false));
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("published", true))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cần duyệt 1 câu hỏi chờ duyệt trước khi công bố bài học."));
        mvc.perform(put("/api/questions/" + pending.get("id")).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("approved", true)))).andExpect(status().isOk());
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("published", true)))).andExpect(jsonPath("$.published").value(true));
        // Renaming a published lesson is not a new publication and is not blocked by later drafts.
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(question(lessonId, ABCD, 1, 2)))).andExpect(status().isCreated());
        mvc.perform(put("/api/lessons/" + lessonId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "Tên mới", "published", true)))).andExpect(status().isOk());
    }

    @Test
    void lessonsWithStudentDataCannotBeDeletedOthersTakeTheirContentAlong() throws Exception {
        String studied = createLesson();
        String sessionId = id("phien");
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("id", sessionId,
                "title", "Phiên", "lessonId", studied, "opens", "2026-10-01T08:00", "closes", "2026-10-08T08:00"))))
                .andExpect(status().isCreated());
        studentStarted(sessionId, Map.of());
        mvc.perform(get("/api/lessons/" + studied).headers(auth(LECTURER))).andExpect(jsonPath("$.activity").value(true));
        mvc.perform(delete("/api/lessons/" + studied).headers(auth(LECTURER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không thể xóa bài học đã có dữ liệu sinh viên."));
        mvc.perform(delete("/api/sessions/" + sessionId).headers(auth(LECTURER))).andExpect(status().isBadRequest());

        String fresh = createLesson();
        Map<String, Object> quiz = question(fresh, ABCD, 0, 1);
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(quiz)))
                .andExpect(status().isCreated());
        String freshSession = id("phien");
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("id", freshSession,
                "title", "Phiên", "lessonId", fresh, "opens", "2026-10-01T08:00", "closes", "2026-10-08T08:00"))))
                .andExpect(status().isCreated());
        mvc.perform(delete("/api/lessons/" + fresh).headers(auth(LECTURER))).andExpect(status().isNoContent());
        tx.executeWithoutResult(s -> {
            assertThat(questionDao.findById((String) quiz.get("id"))).isEmpty();
            assertThat(sessionDao.findById(freshSession)).isEmpty();
        });
    }

    // UC-A01 Câu hỏi gắn slide

    @Test
    void quizQuestionsHaveFourDistinctOptionsOnARealPage() throws Exception {
        String lessonId = createLesson();
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(question(lessonId, List.of("A", "B", "C"), 0, 1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("đúng 4 lựa chọn")));
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(question(lessonId, List.of("A", "B", "C", ""), 0, 1)))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(question(lessonId, List.of("A", "B", "a", "D"), 0, 1))))
                .andExpect(jsonPath("$.message").value("Các lựa chọn của câu hỏi không được trùng nhau."));
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(question(lessonId, ABCD, 4, 1)))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(question(lessonId, ABCD, 0, 4))))
                .andExpect(jsonPath("$.message").value("Trang gắn câu hỏi phải từ 1 đến 3."));
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(question(lessonId, ABCD, 0, 0)))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(question("khong-co", ABCD, 0, 1)))).andExpect(status().isBadRequest());
        Map<String, Object> blank = question(lessonId, ABCD, 0, 1);
        blank.put("text", "x".repeat(1001));
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(blank)))
                .andExpect(status().isBadRequest());
        // Without slide titles the lesson does not limit the page number.
        Map<String, Object> noSlides = question("l2", ABCD, 0, 9);
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(noSlides)))
                .andExpect(status().isCreated());

        String foreignClass = id("LOP");
        otherLecturerWithClass(foreignClass);
        String foreignLesson = id("bai");
        Map<String, Object> foreign = lesson(foreignLesson, "Bài lớp khác");
        foreign.put("classId", foreignClass);
        mvc.perform(post("/api/lessons").headers(auth(OTHER_LECTURER)).contentType(JSON).content(json(foreign)))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(question(foreignLesson, ABCD, 0, 1)))).andExpect(status().isForbidden());
        Map<String, Object> theirs = question(foreignLesson, ABCD, 0, 1);
        mvc.perform(post("/api/questions").headers(auth(OTHER_LECTURER)).contentType(JSON).content(json(theirs)))
                .andExpect(status().isCreated());
        mvc.perform(put("/api/questions/" + theirs.get("id")).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("approved", true)))).andExpect(status().isForbidden());
    }

    @Test
    void studentsOnlyEverSeeApprovedQuestions() throws Exception {
        String lessonId = createLesson();
        Map<String, Object> draft = question(lessonId, ABCD, 0, 1);
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(draft)))
                .andExpect(status().isCreated());
        String url = "/api/questions/" + draft.get("id");
        mvc.perform(get(url).headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(get(url).headers(auth(STUDENT))).andExpect(status().isNotFound());
        mvc.perform(get("/api/questions").headers(auth(STUDENT)))
                .andExpect(jsonPath("$[?(@.id=='" + draft.get("id") + "')]").isEmpty());
        mvc.perform(get("/api/bootstrap").headers(auth(STUDENT)))
                .andExpect(jsonPath("$.questions[?(@.id=='" + draft.get("id") + "')]").isEmpty());
        mvc.perform(get("/api/questions/search").headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("approved", true))))
                .andExpect(status().isOk());
        mvc.perform(get(url).headers(auth(STUDENT))).andExpect(jsonPath("$.lessonId").value(lessonId));
    }

    @Test
    void importIsAllOrNothing() throws Exception {
        String lessonId = createLesson();
        Map<String, Object> good = question(lessonId, ABCD, 0, 1);
        Map<String, Object> bad = question(lessonId, List.of("A", "B"), 0, 1);
        mvc.perform(post("/api/questions/import").headers(auth(LECTURER)).contentType(JSON).content(json(List.of(good, bad))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Dòng 2:")));
        tx.executeWithoutResult(s -> assertThat(questionDao.findById((String) good.get("id"))).isEmpty());
        mvc.perform(post("/api/questions/import").headers(auth(LECTURER)).contentType(JSON).content(json(List.of())))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/questions/import").headers(auth(STUDENT)).contentType(JSON).content(json(List.of(good))))
                .andExpect(status().isForbidden());
        List<Map<String, Object>> tooMany = new ArrayList<>();
        for (int i = 0; i < 501; i++) {
            tooMany.add(good);
        }
        mvc.perform(post("/api/questions/import").headers(auth(LECTURER)).contentType(JSON).content(json(tooMany)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/questions/import").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(List.of(good, question(lessonId, ABCD, 2, 3)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[1].correct").value(2));
    }

    @Test
    void answeredQuestionsCannotBeDeleted() throws Exception {
        String lessonId = createLesson();
        Map<String, Object> quiz = question(lessonId, ABCD, 0, 1);
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(quiz)))
                .andExpect(status().isCreated());
        studentStarted(id("phien"), Map.of((String) quiz.get("id"), 1));
        mvc.perform(delete("/api/questions/" + quiz.get("id")).headers(auth(LECTURER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("đã có sinh viên trả lời")));
    }

    // UC-A02 Phiên tự học

    private Map<String, Object> session(String sessionId, String lessonId, String opens, String closes) {
        Map<String, Object> body = new HashMap<>();
        body.put("id", sessionId);
        body.put("title", "Phiên tự học");
        body.put("lessonId", lessonId);
        body.put("opens", opens);
        body.put("closes", closes);
        return body;
    }

    @Test
    void sessionsNeedValidTimesAndAfterPublishingCanOnlyBeExtended() throws Exception {
        String lessonId = createLesson();
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(session(id("p"), lessonId, "16/10/2026", "2026-10-20T08:00")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(session(id("p"), lessonId, "", "2026-10-20T08:00")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(session(id("p"), lessonId, "2026-10-20T08:00", "2026-10-20T08:00"))))
                .andExpect(jsonPath("$.message").value("Thời điểm đóng phải sau thời điểm mở."));
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON)
                .content(json(session(id("p"), "khong-co", "2026-10-20T08:00", "2026-10-21T08:00")))).andExpect(status().isBadRequest());
        Map<String, Object> longTitle = session(id("p"), lessonId, "2026-10-20T08:00", "2026-10-21T08:00");
        longTitle.put("title", "x".repeat(201));
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON).content(json(longTitle)))
                .andExpect(status().isBadRequest());

        String sessionId = id("p");
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(session(sessionId, lessonId, "2026-10-20T08:00", "2026-10-21T08:00"))))
                .andExpect(jsonPath("$.published").value(false))
                .andExpect(jsonPath("$.late").value(false));
        String url = "/api/sessions/" + sessionId;
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("published", true))))
                .andExpect(status().isOk());
        for (Map<String, Object> change : List.of(Map.<String, Object>of("title", "Đổi tên"),
                Map.<String, Object>of("opens", "2026-10-19T08:00"), Map.<String, Object>of("lessonId", "l2"),
                Map.<String, Object>of("late", true))) {
            mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(change)))
                    .andExpect(jsonPath("$.message").value("Phiên đã công bố chỉ được gia hạn thời gian kết thúc."));
        }
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("closes", "2026-10-20T12:00"))))
                .andExpect(jsonPath("$.message").value("Phiên đã công bố chỉ được gia hạn, không rút ngắn."));
        // The frontend sends the whole row; unchanged fields are fine.
        Map<String, Object> extended = session(sessionId, lessonId, "2026-10-20T08:00", "2026-10-25T23:59");
        extended.put("published", true);
        extended.put("late", false);
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON).content(json(extended)))
                .andExpect(jsonPath("$.closes").value("2026-10-25T23:59"));
        mvc.perform(put(url).headers(auth(STUDENT)).contentType(JSON).content(json(extended))).andExpect(status().isForbidden());
        mvc.perform(delete(url).headers(auth(LECTURER))).andExpect(status().isNoContent());
    }

    // UC-A04 Tài liệu tham khảo

    @Test
    void referenceLinksAreCheckedAndListedInOrder() throws Exception {
        mvc.perform(post("/api/resources").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "Sai", "url", "javascript:alert(1)", "kind", "link")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/resources").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "Video", "url", "https://vimeo.com/1", "kind", "video")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/resources").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "Tệp", "url", "https://a.b/c", "kind", "file")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/resources").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", " ", "url", "https://a.b/c")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/resources").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "Mô tả dài", "url", "https://a.b/c", "description", "x".repeat(501)))))
                .andExpect(status().isBadRequest());
        String first = id("tl");
        String second = id("tl");
        mvc.perform(post("/api/resources").headers(auth(LEADER)).contentType(JSON)
                        .content(json(Map.of("id", first, "title", "Z MDN", "url", "https://developer.mozilla.org"))))
                .andExpect(jsonPath("$.kind").value("link"));
        mvc.perform(post("/api/resources").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("id", second, "title", "A YouTube", "url", "https://www.youtube.com/watch?v=abcdefg",
                        "kind", "video")))).andExpect(status().isCreated());
        mvc.perform(put("/api/resources/" + second).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("position", -5))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/resources").headers(auth(STUDENT)))
                .andExpect(jsonPath("$[0].id").value(second));
        mvc.perform(get("/api/resources/" + first + "/file").headers(auth(STUDENT))).andExpect(status().isNotFound());
    }

    @Test
    void referenceFilesAreUploadedEncryptedAndDownloaded() throws Exception {
        byte[] bytes = "Đề cương học phần CSE301".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "de-cuong.txt", "text/plain", bytes);
        mvc.perform(multipart("/api/resources/upload").file(file).param("title", "Đề cương").headers(auth(STUDENT)))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/api/resources/upload").file(new MockMultipartFile("file", "virus.exe", "application/octet-stream", bytes))
                .headers(auth(LECTURER))).andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/resources/upload").file(new MockMultipartFile("file", "rong.txt", "text/plain", new byte[0]))
                .headers(auth(LECTURER))).andExpect(status().isBadRequest());
        String body = mvc.perform(multipart("/api/resources/upload").file(file).param("title", "Đề cương")
                        .param("description", "Bản 2026").headers(auth(LECTURER)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.kind").value("file"))
                .andExpect(jsonPath("$.fileName").value("de-cuong.txt"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String resourceId = mapper.readTree(body).path("id").asText();
        String url = "/api/resources/" + resourceId;
        var async = mvc.perform(get(url + "/file").headers(auth(STUDENT))).andExpect(request().asyncStarted()).andReturn();
        mvc.perform(asyncDispatch(async))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(content().bytes(bytes));
        // A file's url and kind belong to the server.
        mvc.perform(put(url).headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("title", "Đề cương mới", "url", "https://evil.example", "kind", "link"))))
                .andExpect(jsonPath("$.url").value(url + "/file"))
                .andExpect(jsonPath("$.kind").value("file"));
        mvc.perform(multipart("/api/resources/upload").file(new MockMultipartFile("file", "bai.pdf", "application/pdf", bytes))
                .headers(auth(LECTURER))).andExpect(jsonPath("$.kind").value("pdf")).andExpect(jsonPath("$.title").value("bai.pdf"));
        mvc.perform(delete(url).headers(auth(LECTURER))).andExpect(status().isNoContent());
        mvc.perform(get(url + "/file").headers(auth(STUDENT))).andExpect(status().isNotFound());
    }

    // UC-G05

    @Test
    void lecturerImportNeedsAFaculty() throws Exception {
        Map<String, Object> row = new HashMap<>();
        row.put("id", id("GV"));
        row.put("name", "Giảng viên mới");
        row.put("email", row.get("id") + "@example.edu");
        row.put("kind", "teacher");
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(row))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Thiếu khoa")));
        row.put("faculty", "CNTT");
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(row))))
                .andExpect(jsonPath("$[0].role").value("giang-vien"))
                .andExpect(jsonPath("$[0].mustChange").value(true));
    }
}
