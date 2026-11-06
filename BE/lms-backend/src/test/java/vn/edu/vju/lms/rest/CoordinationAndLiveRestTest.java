package vn.edu.vju.lms.rest;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ILiveStateDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.LiveState;

class CoordinationAndLiveRestTest extends AbstractApiTest {

    private static final String ITEMS = "/api/coordination/items";
    private static final String REQUESTS = "/api/coordination/requests";

    @Autowired
    private IClassInfoDao classDao;

    @Autowired
    private ILiveStateDao liveDao;

    private String classId;

    @BeforeEach
    void data() {
        classId = "CO-" + UUID.randomUUID().toString().substring(0, 8);
        ClassInfo info = new ClassInfo();
        info.setId(classId);
        info.setCourseId("cs301");
        info.setName(classId);
        info.setTeacherId(LECTURER);
        tx.executeWithoutResult(s -> classDao.persist(info));
    }

    private String item(String kind, boolean editable) throws Exception {
        String id = "it-" + UUID.randomUUID();
        mvc.perform(post(ITEMS).headers(auth(LEADER)).contentType(JSON).content(json(Map.of(
                "id", id, "courseId", "cs301", "classId", classId, "kind", kind, "title", "T", "body", "B", "editable", editable))))
                .andExpect(status().isCreated());
        return id;
    }

    private String request(String itemId) throws Exception {
        String id = "rq-" + UUID.randomUUID();
        mvc.perform(post(REQUESTS).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("id", id, "itemId", itemId, "body", "Sửa"))))
                .andExpect(status().isCreated());
        return id;
    }

    private void level(String itemId, int level) throws Exception {
        mvc.perform(put(ITEMS + "/" + itemId).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("level", level))))
                .andExpect(status().isOk());
    }

    @Test
    void reviewFollowsTheRequestReplyApprovalCycle() throws Exception {
        String item = item("slides", true);
        String request = request(item);
        mvc.perform(post(REQUESTS).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("id", "rq2-" + item, "itemId", item, "body", "Nữa"))))
                .andExpect(status().isBadRequest());
        mvc.perform(put(ITEMS + "/" + item).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("level", 3))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Chờ giảng viên phản hồi trước khi duyệt đạt chuẩn."));
        mvc.perform(put(REQUESTS + "/" + request).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("reply", "Đã sửa"))))
                .andExpect(jsonPath("$.reply").value("Đã sửa"));
        level(item, 3);
    }

    @Test
    void onlyTheClassLecturerMayReply() throws Exception {
        ClassInfo info = tx.execute(s -> {
            ClassInfo found = classDao.findById(classId).orElseThrow();
            found.setTeacherId("GV999");
            return found;
        });
        String request = request(item("quiz", true));
        mvc.perform(put(REQUESTS + "/" + request).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("reply", "x"))))
                .andExpect(status().isForbidden());
        org.assertj.core.api.Assertions.assertThat(info).isNotNull();
    }

    @Test
    void requestForUnknownItemIsNotFound() throws Exception {
        mvc.perform(post(REQUESTS).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("id", "rqx", "itemId", "khong-co", "body", "x"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void readOnlyItemsKeepTheirContentAndKind() throws Exception {
        String locked = item("slides", false);
        mvc.perform(put(ITEMS + "/" + locked).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("body", "Sửa"))))
                .andExpect(status().isForbidden());
        level(locked, 1);
        String open = item("slides", true);
        mvc.perform(put(ITEMS + "/" + open).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("kind", "quiz"))))
                .andExpect(status().isBadRequest());
        mvc.perform(post(ITEMS).headers(auth(LEADER)).contentType(JSON).content(json(Map.of(
                "courseId", "cs301", "classId", classId, "kind", "video", "title", "T", "body", "B"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void classCompletesOnlyWhenEverythingIsStandardized() throws Exception {
        String completed = "/api/coordination/completed/" + classId;
        String slides = item("slides", true);
        String quiz = item("quiz", true);
        mvc.perform(put(completed).headers(auth(LEADER))).andExpect(status().isBadRequest());
        String assignment = item("assignment", true);
        level(slides, 3);
        level(quiz, 3);
        mvc.perform(put(completed).headers(auth(LEADER))).andExpect(status().isBadRequest());
        level(assignment, 3);
        mvc.perform(put(completed).headers(auth(LEADER))).andExpect(status().isNoContent());
        mvc.perform(put(completed).headers(auth(LEADER))).andExpect(status().isNoContent());
        mvc.perform(get("/api/bootstrap").headers(auth(LEADER)))
                .andExpect(jsonPath("$.coordination.completed", hasItem(classId)));

        level(slides, 1);
        mvc.perform(get("/api/bootstrap").headers(auth(LEADER)))
                .andExpect(jsonPath("$.coordination.completed", not(hasItem(classId))));
        level(slides, 3);
        mvc.perform(put(completed).headers(auth(LEADER))).andExpect(status().isNoContent());
        mvc.perform(delete(completed).headers(auth(LEADER))).andExpect(status().isNoContent());
        mvc.perform(delete(completed).headers(auth(LEADER))).andExpect(status().isNoContent());
        mvc.perform(put(completed).headers(auth(STUDENT))).andExpect(status().isForbidden());
    }

    @Test
    void referencesMustBeSafeUrls() throws Exception {
        String url = "/api/coordination/references";
        for (String bad : new String[] {"javascript:alert(1)", "/materials/../secret", "ftp://x"}) {
            mvc.perform(post(url).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("courseId", "c", "title", "t", "url", bad))))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post(url).headers(auth(LEADER)).contentType(JSON).content(json(Map.of("courseId", "c", "title", "t", "url", "/materials/a.pdf"))))
                .andExpect(status().isCreated());
    }

    @Test
    void bootstrapIsFilteredForStudents() throws Exception {
        mvc.perform(post("/api/gaps").headers(auth(OTHER_STUDENT)).contentType(JSON).content(json(Map.of("page", 1, "body", "Riêng tư"))))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/bootstrap").headers(auth(STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gaps[?(@.body == 'Riêng tư')]").isEmpty())
                .andExpect(jsonPath("$.coordination.items", hasSize(0)))
                .andExpect(jsonPath("$.admin.users[?(@.id == 'GV001')].email").value(""))
                .andExpect(jsonPath("$.profile.email").value("sv001@example.edu"));
        mvc.perform(get("/api/bootstrap").headers(auth(ADMIN)))
                .andExpect(jsonPath("$.admin.users[?(@.id == 'GV001')].email").value("gv001@example.edu"));
        mvc.perform(get("/api/bootstrap").headers(auth(DEAN))).andExpect(jsonPath("$.deanProfile.name").isNotEmpty());
        mvc.perform(get("/api/bootstrap").headers(auth(LECTURER))).andExpect(jsonPath("$.teacherProfile.name").isNotEmpty());
    }

    private void resetLive() {
        tx.executeWithoutResult(s -> liveDao.findById(LiveState.SINGLETON_ID).ifPresent(liveDao::remove));
    }

    private Map<String, Object> control(boolean active, long expiresAt) {
        Map<String, Object> body = new HashMap<>();
        body.put("active", active);
        body.put("question", 0);
        body.put("revealed", false);
        body.put("expiresAt", expiresAt);
        body.put("reset", true);
        return body;
    }

    @Test
    void liveQuestionRevealsWhenEveryoneAnswered() throws Exception {
        resetLive();
        mvc.perform(put("/api/live").headers(auth(LECTURER)).contentType(JSON)
                .content(json(control(true, System.currentTimeMillis() + 60000))))
                .andExpect(jsonPath("$.active").value(true));
        mvc.perform(put("/api/live/me").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of("join", true))))
                .andExpect(jsonPath("$.participants", hasItem(STUDENT)));
        mvc.perform(put("/api/live/me").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of("join", true, "answer", 2))))
                .andExpect(jsonPath("$.answers.SV001").value(2))
                .andExpect(jsonPath("$.participants", hasSize(1)))
                .andExpect(jsonPath("$.revealed").value(true));
        mvc.perform(put("/api/live/me").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of("join", false, "answer", 1))))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/live").headers(auth(STUDENT)).contentType(JSON).content("{}")).andExpect(status().isForbidden());
    }

    @Test
    void expiredQuestionMarksSilentStudents() throws Exception {
        resetLive();
        mvc.perform(put("/api/live").headers(auth(LECTURER)).contentType(JSON)
                .content(json(control(true, System.currentTimeMillis() + 60000)))).andExpect(status().isOk());
        mvc.perform(put("/api/live/me").headers(auth(OTHER_STUDENT)).contentType(JSON).content(json(Map.of("join", true))))
                .andExpect(status().isOk());
        Map<String, Object> expire = new HashMap<>();
        expire.put("expiresAt", 1L);
        mvc.perform(put("/api/live").headers(auth(LECTURER)).contentType(JSON).content(json(expire))).andExpect(status().isOk());
        mvc.perform(get("/api/live").headers(auth(STUDENT)))
                .andExpect(jsonPath("$.revealed").value(true))
                .andExpect(jsonPath("$.answers.SV002").value(-1));
    }

    @Test
    void cannotRespondToClosedSession() throws Exception {
        resetLive();
        mvc.perform(put("/api/live/me").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of("join", true))))
                .andExpect(status().isBadRequest());
    }
}
