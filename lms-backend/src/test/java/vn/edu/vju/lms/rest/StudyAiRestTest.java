package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.ai.AiClient;
import vn.edu.vju.lms.ai.AiProviderException;
import vn.edu.vju.lms.ai.RagAnswerService;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IKnowledgeGapDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.entity.KnowledgeGap;
import vn.edu.vju.lms.entity.RagChunk;

class StudyAiRestTest extends AbstractApiTest {

    private static final String CHUNK_TEXT = "REST dùng URI để định danh\ntài nguyên. PATCH cập nhật một phần tài nguyên.";

    @MockitoBean
    private AiClient client;

    @MockitoBean
    private RagAnswerService rag;

    @Autowired
    private IKnowledgeGapDao gapDao;

    @Autowired
    private IAssignmentDao assignmentDao;

    @BeforeEach
    void clean() {
        reset(client, rag);
    }

    private String course() {
        String courseId = "ai-" + UUID.randomUUID();
        ClassInfo info = new ClassInfo();
        info.setId("c-" + UUID.randomUUID().toString().substring(0, 30));
        info.setCourseId(courseId);
        info.setName(info.getId());
        info.setTeacherId(LECTURER);
        info.setStudentIds(new ArrayList<>(List.of(STUDENT)));
        tx.executeWithoutResult(s -> classDao.persist(info));
        return courseId;
    }

    private static RagChunk chunk(int page) {
        RagChunk chunk = new RagChunk();
        chunk.setPage(page);
        chunk.setText(CHUNK_TEXT);
        chunk.setMaterialTitle("Bài giảng REST");
        chunk.setChunkKey("k-" + page + "-" + UUID.randomUUID());
        return chunk;
    }

    private JsonNode node(String json) throws Exception {
        return mapper.readTree(json);
    }

    private void model(String json) throws Exception {
        when(client.chatConfigured()).thenReturn(true);
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenReturn(node(json));
    }

    private void gap(int page, String body) {
        KnowledgeGap gap = new KnowledgeGap();
        gap.setId("g-" + UUID.randomUUID());
        gap.setOwnerId(STUDENT);
        gap.setPage(page);
        gap.setBody(body);
        tx.executeWithoutResult(s -> gapDao.persist(gap));
    }

    private void resolveAllGaps() {
        tx.executeWithoutResult(s -> gapDao.findAll().forEach(g -> g.setResponse("Đã trả lời")));
    }

    // Bài giảng AI

    @Test
    void explanationsAreDraftedReviewedAndPublished() throws Exception {
        String course = course();
        String base = "/api/ai/lessons/" + course + "/explanations";
        mvc.perform(post(base + "/generate").headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(post(base + "/generate").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Chưa cấu hình khóa AI")));
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(1), chunk(1), chunk(2)));
        model("""
                {"pages":[
                 {"page":1,"main":"REST tổ chức API quanh **tài nguyên**.","example":"GET /books đọc danh sách.","summary":"URI định danh tài nguyên."},
                 {"page":2,"explanation":"PATCH cập nhật một phần tài nguyên đã có."},
                 {"page":9,"main":"Trang không tồn tại trong tài liệu này."}]}""");
        mvc.perform(post(base + "/generate").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].content").value(containsString("Ý chính\nREST tổ chức API")))
                .andExpect(jsonPath("$[0].content").value(containsString("Tóm tắt\nURI định danh")))
                .andExpect(jsonPath("$[0].published").value(false));
        mvc.perform(get(base).headers(auth(STUDENT))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(put(base + "/1").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("published", true))))
                .andExpect(jsonPath("$.published").value(true))
                .andExpect(jsonPath("$.edited").value(false));
        mvc.perform(get(base).headers(auth(STUDENT))).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get(base).headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(put(base + "/2").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("content", "Giảng viên tự viết lại."))))
                .andExpect(jsonPath("$.edited").value(true));

        // Regenerating keeps the lecturer's edit and takes the redrafted page back to review.
        mvc.perform(post(base + "/generate").headers(auth(LECTURER)))
                .andExpect(jsonPath("$[?(@.page==1)].published").value(false))
                .andExpect(jsonPath("$[?(@.page==2)].content").value("Giảng viên tự viết lại."));
        mvc.perform(post(base + "/generate").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("pages", List.of(2)))))
                .andExpect(status().isBadRequest());
        mvc.perform(post(base + "/generate").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("pages", List.of(2), "overwriteEdited", true))))
                .andExpect(jsonPath("$[?(@.page==2)].edited").value(false));

        mvc.perform(put(base + "/5").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("published", true))))
                .andExpect(status().isBadRequest());
        mvc.perform(put(base + "/0").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("content", "x"))))
                .andExpect(status().isBadRequest());
        mvc.perform(put(base + "/5").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("content", "Viết tay", "published", true))))
                .andExpect(jsonPath("$.page").value(5))
                .andExpect(jsonPath("$.published").value(true));
        mvc.perform(get(base).headers(auth(LECTURER))).andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void explanationFailuresAreReported() throws Exception {
        String course = course();
        String generate = "/api/ai/lessons/" + course + "/explanations/generate";
        when(client.chatConfigured()).thenReturn(true);
        when(rag.candidates(anyList())).thenReturn(List.of());
        mvc.perform(post(generate).headers(auth(LECTURER)))
                .andExpect(jsonPath("$.message").value("Chưa có học liệu đã lập chỉ mục cho học phần này."));
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(1)));
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenThrow(new AiProviderException("HTTP 503"));
        mvc.perform(post(generate).headers(auth(LECTURER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không gọi được model soạn bài giảng AI. Hãy thử lại sau."));
    }

    // Gợi ý buổi học

    @Test
    void insightsFallBackToStatisticsAndHideStudentIdentities() throws Exception {
        String course = course();
        resolveAllGaps();
        mvc.perform(post("/api/ai/insights").headers(auth(STUDENT)).contentType(JSON).content(json(Map.of("courseId", course))))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/ai/insights").headers(auth(LECTURER)))
                .andExpect(jsonPath("$.mode").value("rules"));
        gap(77, "Người dùng SV001 (sv001@example.edu) chưa hiểu PATCH khác PUT ở đâu.");
        mvc.perform(post("/api/ai/insights").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("courseId", course))))
                .andExpect(jsonPath("$.mode").value("rules"))
                .andExpect(jsonPath("$.themes[?(@.title=='Trang 77')]").isNotEmpty());

        when(rag.candidates(anyList())).thenReturn(List.of(chunk(77)));
        model("""
                {"summary":"Lớp còn nhầm PATCH với PUT.",
                 "themes":[{"title":"PATCH và PUT","pages":[77,999],"explanation":"Hai method đều cập nhật."},{"title":""}],
                 "discussion":[{"question":"Khi nào dùng PATCH?","why":"Phân biệt","pages":[77]}],
                 "activities":["Nhóm 5 phút", ""]}""");
        mvc.perform(post("/api/ai/insights").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("courseId", course))))
                .andExpect(jsonPath("$.mode").value("ai"))
                .andExpect(jsonPath("$.themes", hasSize(1)))
                .andExpect(jsonPath("$.themes[0].pages", hasSize(1)))
                .andExpect(jsonPath("$.discussion[0].question").value("Khi nào dùng PATCH?"))
                .andExpect(jsonPath("$.activities", hasSize(1)));
        ArgumentCaptor<String> payload = ArgumentCaptor.forClass(String.class);
        verify(client).chatJson(any(), anyString(), payload.capture(), anyInt());
        assertThat(payload.getValue()).contains("[ẩn danh]").doesNotContain("SV001").doesNotContain("example.edu");

        model("{\"summary\":\"\",\"themes\":[]}");
        mvc.perform(post("/api/ai/insights").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("courseId", course))))
                .andExpect(jsonPath("$.mode").value("rules"));
        resolveAllGaps();
    }

    // Giải thích câu sai

    private String exam() {
        Assignment assignment = new Assignment();
        assignment.setId("mis-" + UUID.randomUUID());
        assignment.setTitle("Kiểm tra REST");
        assignment.setMinutes(10);
        assignment.setOpens("2020-01-01T00:00");
        assignment.setCloses("2099-01-01T00:00");
        assignment.setPublished(true);
        assignment.setAttempts(3);
        assignment.setQuestions(List.of(
                new ExamQuestion(ExamQuestion.CHOICE, "Tài nguyên được định danh bằng gì?", List.of("URI", "TCP"), "0", 4.0, "Dùng URI."),
                new ExamQuestion(ExamQuestion.BLANK, "Method tạo mới?", null, "POST", 3.0, null),
                new ExamQuestion(ExamQuestion.ESSAY, "Thiết kế API", null, "Tiêu chí", 3.0, null)));
        tx.executeWithoutResult(s -> assignmentDao.persist(assignment));
        return assignment.getId();
    }

    private void submit(String id, List<String> answers) throws Exception {
        Map<String, Object> draft = new HashMap<>();
        draft.put("draft", Map.of("answers", List.of("", "", "")));
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(draft)))
                .andExpect(status().isOk());
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("result", Map.of("answers", answers))))).andExpect(status().isOk());
    }

    private Map<String, Object> mistake(String id, int index) {
        return Map.of("assignmentId", id, "questionIndex", index);
    }

    @Test
    void wrongAnswersAreExplainedFromTheMaterial() throws Exception {
        String id = exam();
        String url = "/api/ai/mistake-explanation";
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(status().isBadRequest());
        submit(id, List.of("1", "GET", "Bài làm"));
        mvc.perform(post(url).headers(auth(LECTURER)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(status().isForbidden());
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 2))))
                .andExpect(status().isBadRequest());
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 7))))
                .andExpect(status().isBadRequest());
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake("khong-co", 0))))
                .andExpect(status().isBadRequest());

        when(rag.search(anyString(), anyList(), anyInt())).thenReturn(List.of());
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 1))))
                .andExpect(jsonPath("$.mode").value("extractive"))
                .andExpect(jsonPath("$.answer").value("Đáp án đúng là \"POST\"."))
                .andExpect(jsonPath("$.pages", hasSize(0)));

        when(rag.search(anyString(), anyList(), anyInt())).thenReturn(List.of(chunk(3)));
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(jsonPath("$.mode").value("extractive"))
                .andExpect(jsonPath("$.answer").value(containsString("Đáp án đúng là \"URI\". Dùng URI.")))
                .andExpect(jsonPath("$.pages[0]").value(3));

        when(client.chatConfigured()).thenReturn(true);
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenThrow(new AiProviderException("Lỗi"));
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(jsonPath("$.mode").value("extractive"));

        reset(client);
        model("{\"supported\":false,\"blocks\":[]}");
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(jsonPath("$.mode").value("extractive"));

        reset(client);
        model("{\"supported\":true,\"blocks\":[{\"text\":\"TCP là giao thức vận chuyển, không định danh tài nguyên.\",\"source_ids\":[1]}]}");
        for (int i = 0; i < 2; i++) {
            mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                    .andExpect(jsonPath("$.mode").value("ai"))
                    .andExpect(jsonPath("$.answer").value("TCP là giao thức vận chuyển, không định danh tài nguyên. [1]"))
                    .andExpect(jsonPath("$.pages[0]").value(3));
        }
        // The second request is served from the cache, without another model call.
        verify(client, times(1)).chatJson(any(), anyString(), anyString(), anyInt());

        submit(id, List.of("0", "POST", ""));
        mvc.perform(post(url).headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Chỉ giải thích câu trắc nghiệm hoặc điền trống đã trả lời sai."));
    }

    @Test
    void blankAndOutOfRangeChoicesAreShownReadably() throws Exception {
        String id = exam();
        submit(id, List.of("", "", ""));
        when(rag.search(anyString(), anyList(), anyInt())).thenReturn(List.of());
        model("{\"supported\":false,\"blocks\":[]}");
        mvc.perform(post("/api/ai/mistake-explanation").headers(auth(STUDENT)).contentType(JSON).content(json(mistake(id, 0))))
                .andExpect(jsonPath("$.mode").value("extractive"));
        String other = exam();
        submit(other, List.of("9", "x", ""));
        mvc.perform(post("/api/ai/mistake-explanation").headers(auth(STUDENT)).contentType(JSON).content(json(mistake(other, 0))))
                .andExpect(jsonPath("$.mode").value("extractive"));
        String text = exam();
        submit(text, List.of("abc", "x", ""));
        mvc.perform(post("/api/ai/mistake-explanation").headers(auth(STUDENT)).contentType(JSON).content(json(mistake(text, 0))))
                .andExpect(jsonPath("$.mode").value("extractive"));
    }

    // Thẻ ôn và FAQ

    @Test
    void cardsAreDraftedWithQuotesThenReviewedOnASchedule() throws Exception {
        String course = course();
        Map<String, Object> request = Map.of("courseId", course, "kind", "card");
        mvc.perform(post("/api/ai/aids/generate").headers(auth(STUDENT)).contentType(JSON).content(json(request)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON).content(json(request)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("courseId", course, "kind", "quiz")))).andExpect(status().isBadRequest());
        when(client.chatConfigured()).thenReturn(true);
        when(rag.candidates(anyList())).thenReturn(List.of());
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON).content(json(request)))
                .andExpect(jsonPath("$.message").value("Chưa có học liệu đã lập chỉ mục cho học phần này."));
        List<RagChunk> many = new ArrayList<>();
        for (int page = 1; page <= 20; page++) {
            many.add(chunk(page));
        }
        when(rag.candidates(anyList())).thenReturn(many);
        model("""
                {"items":[
                 {"front":"URI dùng để làm gì?","back":"URI định danh mỗi tài nguyên trong REST.","topic":"REST","quote":"REST dùng URI để định danh tài nguyên.","source_ids":[2]},
                 {"front":"Câu không có nguồn?","back":"Một câu trả lời không có trong tài liệu.","quote":"Câu này không có trong tài liệu.","source_ids":[1]},
                 {"front":"Nguồn giả mạo?","back":"Marker vượt quá số nguồn đã gửi.","quote":"REST dùng URI để định danh","source_ids":[99]},
                 {"front":"Ngắn","back":"Quá ngắn","quote":"REST dùng URI","source_ids":[1]},
                 {"front":"Thiếu nguồn hoàn toàn?","back":"Không có source_ids nào cả.","quote":"REST dùng URI để định danh","source_ids":[]}]}""");
        String aidId = mapper.readTree(mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(request)))
                .andExpect(jsonPath("$", hasSize(1)))
                // Twelve sources are spread over twenty chunks, so marker 2 is the chunk of page 3.
                .andExpect(jsonPath("$[0].page").value(3))
                .andExpect(jsonPath("$[0].origin").value("ai"))
                .andExpect(jsonPath("$[0].published").value(false))
                .andReturn().getResponse().getContentAsString()).path(0).path("id").asText();

        mvc.perform(get("/api/ai/aids").param("courseId", course).headers(auth(STUDENT))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(post("/api/ai/aids/" + aidId + "/review").headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("remembered", true)))).andExpect(status().isNotFound());
        mvc.perform(put("/api/ai/aids/" + aidId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("front", "URI để làm gì trong REST?", "back", "Định danh tài nguyên duy nhất.", "topic", "URI",
                        "published", true))))
                .andExpect(jsonPath("$.front").value("URI để làm gì trong REST?"))
                .andExpect(jsonPath("$.topic").value("URI"));
        mvc.perform(get("/api/ai/aids").param("courseId", course).param("kind", "card").headers(auth(STUDENT)))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].review").doesNotExist());
        mvc.perform(post("/api/ai/aids/" + aidId + "/review").headers(auth(STUDENT)).contentType(JSON)
                        .content(json(Map.of("remembered", true))))
                .andExpect(jsonPath("$.repetitions").value(1))
                .andExpect(jsonPath("$.intervalDays").value(1))
                .andExpect(jsonPath("$.due").value(false));
        mvc.perform(post("/api/ai/aids/" + aidId + "/review").headers(auth(STUDENT)).contentType(JSON)
                        .content(json(Map.of("remembered", true))))
                .andExpect(jsonPath("$.intervalDays").value(3));
        mvc.perform(post("/api/ai/aids/" + aidId + "/review").headers(auth(STUDENT)).contentType(JSON)
                        .content(json(Map.of("remembered", false))))
                .andExpect(jsonPath("$.repetitions").value(0))
                .andExpect(jsonPath("$.intervalDays").value(0));
        mvc.perform(get("/api/ai/aids").param("courseId", course).headers(auth(STUDENT)))
                .andExpect(jsonPath("$[0].review.repetitions").value(0));
        mvc.perform(get("/api/ai/aids").param("courseId", course).headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(post("/api/ai/aids/" + aidId + "/review").headers(auth(OTHER_STUDENT)).contentType(JSON)
                .content(json(Map.of("remembered", true)))).andExpect(status().isNotFound());

        mvc.perform(delete("/api/ai/aids/" + aidId).headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/ai/aids/" + aidId).headers(auth(LECTURER))).andExpect(status().isNoContent());
        mvc.perform(put("/api/ai/aids/" + aidId).headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("published", true))))
                .andExpect(status().isNotFound());
    }

    @Test
    void faqNeedsOpenGapsAndManualAidsCanBeWritten() throws Exception {
        String course = course();
        Map<String, Object> request = Map.of("courseId", course, "kind", "faq");
        when(client.chatConfigured()).thenReturn(true);
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(4)));
        resolveAllGaps();
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON).content(json(request)))
                .andExpect(jsonPath("$.message").value("Chưa có kiến thức mờ nào cần giải đáp để soạn FAQ."));
        gap(88, "PATCH khác PUT thế nào?");
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenThrow(new AiProviderException("Lỗi"));
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON).content(json(request)))
                .andExpect(jsonPath("$.message").value("Trợ lý AI tạm thời không phản hồi. Bạn hãy thử lại sau."));
        reset(client);
        model("{\"items\":[]}");
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON).content(json(request)))
                .andExpect(jsonPath("$.message").value("Model chưa trả nội dung có nguồn hợp lệ. Chưa tạo bản nháp."));
        gap(4, "Vẫn chưa rõ PATCH.");
        model("""
                {"items":[{"front":"PATCH khác PUT ở điểm nào?","back":"PATCH chỉ cập nhật một phần tài nguyên.","quote":"PATCH cập nhật một phần tài nguyên.","source_ids":[1]}]}""");
        mvc.perform(post("/api/ai/aids/generate").headers(auth(LECTURER)).contentType(JSON).content(json(request)))
                .andExpect(jsonPath("$[0].kind").value("faq"))
                .andExpect(jsonPath("$[0].page").value(4));
        resolveAllGaps();

        mvc.perform(post("/api/ai/aids").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("courseId", course, "kind", "faq", "front", "Nộp bài muộn được không?",
                                "back", "Theo quy định của từng bài tập."))))
                .andExpect(jsonPath("$.origin").value("manual"))
                .andExpect(jsonPath("$.topic").value(""));
        mvc.perform(post("/api/ai/aids").headers(auth(LECTURER)).contentType(JSON)
                        .content(json(Map.of("courseId", course, "kind", "card", "front", "Mặt trước?", "back", "Mặt sau đầy đủ.",
                                "topic", " REST ", "page", 2))))
                .andExpect(jsonPath("$.topic").value("REST"));
        mvc.perform(get("/api/ai/aids").param("courseId", course).param("kind", "faq").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/ai/aids").param("courseId", course).param("kind", "").headers(auth(LECTURER)))
                .andExpect(jsonPath("$", hasSize(3)));
        mvc.perform(get("/api/ai/aids").headers(auth(LECTURER))).andExpect(status().isOk());
    }
}
