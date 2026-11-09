package vn.edu.vju.lms.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.entity.RagChunk;

class QuestionAndEssayAiTest extends AbstractApiTest {

    private static final String PRACTICE = "/api/ai/practice";
    private static final String SUGGEST = "/api/ai/question-suggestions";
    private static final int PAGE = 41;
    private static final int OTHER_PAGE = 42;

    @MockitoBean
    private AiClient client;

    @MockitoBean
    private RagAnswerService rag;

    @Autowired
    private IQuestionDao questionDao;

    @Autowired
    private IAssignmentDao assignmentDao;

    @Autowired
    private IAssessmentDao assessmentDao;

    @BeforeEach
    void clean() {
        reset(client, rag);
    }

    private RagChunk chunk(int page) {
        RagChunk chunk = new RagChunk();
        chunk.setPage(page);
        chunk.setText("REST dùng URI để định danh tài nguyên.");
        chunk.setMaterialTitle("Bài giảng");
        return chunk;
    }

    private void bank(int page, String... answers) {
        tx.executeWithoutResult(s -> {
            for (String answer : answers) {
                Question question = new Question();
                question.setId("pq-" + UUID.randomUUID());
                question.setText("Câu " + answer);
                question.setOptions(List.of(answer, "Khác"));
                question.setCorrect(0);
                question.setExplanation("Giải thích");
                question.setPage(page);
                question.setApproved(true);
                questionDao.persist(question);
            }
        });
    }

    private JsonNode generated(String json) throws Exception {
        return mapper.readTree(json);
    }

    private Map<String, Object> range(int from, int to) {
        return Map.of("courseId", "cs301", "fromPage", from, "toPage", to, "round", 1);
    }

    @Test
    void withoutAModelPracticeComesFromTheApprovedBankAndRotates() throws Exception {
        when(rag.candidates(anyList())).thenReturn(List.of());
        bank(PAGE, "URI", "Một câu trả lời đúng nhưng dài hơn giới hạn điền trống rất nhiều");
        mvc.perform(post(PRACTICE).headers(auth(STUDENT)).contentType(JSON).content(json(range(PAGE, PAGE))))
                .andExpect(jsonPath("$.mode").value("bank"))
                .andExpect(jsonPath("$.questions", hasSize(2)))
                .andExpect(jsonPath("$.questions[?(@.answer=='URI')]").isNotEmpty());
        mvc.perform(post(PRACTICE).headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("courseId", "cs301", "fromPage", PAGE, "toPage", PAGE, "round", 2))))
                .andExpect(jsonPath("$.questions", hasSize(2)));
    }

    @Test
    void tooLittleContentIsReported() throws Exception {
        when(rag.candidates(anyList())).thenReturn(List.of());
        mvc.perform(post(PRACTICE).headers(auth(STUDENT)).contentType(JSON).content(json(range(900, 901))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Nội dung học liệu chưa đủ để tạo câu hỏi."));
    }

    @Test
    void modelQuestionsAreValidatedBeforeReachingTheStudent() throws Exception {
        when(client.chatConfigured()).thenReturn(true);
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(5), chunk(6), chunk(99)));
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenReturn(generated("""
                {"questions":[
                 {"type":"choice","title":"Định danh bằng gì?","options":["URI","TCP","Cookie","SQL"],"answer":"URI","explanation":"Vì URI","page":6},
                 {"type":"blank","title":"Viết tắt?","answer":"URI","page":77},
                 {"type":"choice","title":"Sai đáp án","options":["A","B","C","D"],"answer":"Z"},
                 {"type":"blank","title":"","answer":"x"},
                 {"type":"blank","title":"Thừa","answer":"y"}]}"""));
        mvc.perform(post(PRACTICE).headers(auth(STUDENT)).contentType(JSON).content(json(range(5, 6))))
                .andExpect(jsonPath("$.mode").value("ai"))
                .andExpect(jsonPath("$.questions", hasSize(3)))
                .andExpect(jsonPath("$.questions[0].page").value(6))
                .andExpect(jsonPath("$.questions[1].page").value(5))
                .andExpect(jsonPath("$.questions[1].options").doesNotExist());
    }

    @Test
    void providerFailureFallsBackToTheBank() throws Exception {
        when(client.chatConfigured()).thenReturn(true);
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(PAGE)));
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenThrow(new AiProviderException("Lỗi"));
        bank(OTHER_PAGE, "HTTP");
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(OTHER_PAGE)));
        mvc.perform(post(PRACTICE).headers(auth(STUDENT)).contentType(JSON).content(json(range(OTHER_PAGE, OTHER_PAGE))))
                .andExpect(jsonPath("$.mode").value("bank"));
        doReturn(generated("{\"questions\":[]}")).when(client).chatJson(any(), anyString(), anyString(), anyInt());
        mvc.perform(post(PRACTICE).headers(auth(STUDENT)).contentType(JSON).content(json(range(OTHER_PAGE, OTHER_PAGE))))
                .andExpect(jsonPath("$.mode").value("bank"));
    }

    @Test
    void suggestionsAreForStaffAndNeedAModelAndMaterial() throws Exception {
        mvc.perform(post(SUGGEST).headers(auth(STUDENT)).contentType(JSON).content(json(range(1, 2))))
                .andExpect(status().isForbidden());
        mvc.perform(post(SUGGEST).headers(auth(LECTURER)).contentType(JSON).content(json(range(1, 2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Chưa cấu hình khóa AI nên chưa thể gợi ý câu hỏi."));
        when(client.chatConfigured()).thenReturn(true);
        when(rag.candidates(anyList())).thenReturn(List.of());
        mvc.perform(post(SUGGEST).headers(auth(LECTURER)).contentType(JSON).content(json(range(1, 2))))
                .andExpect(status().isBadRequest());
        when(rag.candidates(anyList())).thenReturn(List.of(chunk(1)));
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenReturn(generated("""
                {"questions":[{"type":"choice","title":"T?","options":["1","2","3","4"],"answer":"2","explanation":"E","page":1}]}"""));
        mvc.perform(post(SUGGEST).headers(auth(LECTURER)).contentType(JSON).content(json(range(1, 2))))
                .andExpect(jsonPath("$", hasSize(1)));
        reset(client);
        when(client.chatConfigured()).thenReturn(true);
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenThrow(new AiProviderException("Lỗi"));
        mvc.perform(post(SUGGEST).headers(auth(LECTURER)).contentType(JSON).content(json(range(1, 2))))
                .andExpect(status().isBadRequest());
    }

    private String essayExam() {
        Assignment assignment = new Assignment();
        assignment.setClassId(vn.edu.vju.lms.security.TeachingScope.DEFAULT_CLASS);
        assignment.setId("ess-" + UUID.randomUUID());
        assignment.setTitle("Tự luận");
        assignment.setMinutes(10);
        assignment.setOpens("2020-01-01T00:00");
        assignment.setCloses("2099-01-01T00:00");
        assignment.setPublished(true);
        assignment.setAttempts(2);
        assignment.setQuestions(List.of(
                new ExamQuestion(ExamQuestion.CHOICE, "A?", List.of("x", "y"), "0", 6.0, null),
                new ExamQuestion(ExamQuestion.ESSAY, "Viết", null, "Tiêu chí", 4.0, null)));
        tx.executeWithoutResult(s -> assignmentDao.persist(assignment));
        return assignment.getId();
    }

    private void submit(String id) throws Exception {
        Map<String, Object> draft = new HashMap<>();
        draft.put("draft", Map.of("answers", List.of("", "")));
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(draft)))
                .andExpect(status().isOk());
        Map<String, Object> submission = new HashMap<>();
        submission.put("result", Map.of("answers", List.of("0", "Bài làm")));
        mvc.perform(put("/api/assessments/" + id).headers(auth(STUDENT)).contentType(JSON).content(json(submission)))
                .andExpect(status().isOk());
    }

    private Double score(String id) {
        return tx.execute(s -> assessmentDao.find(STUDENT, id).orElseThrow().getScore());
    }

    @Test
    void submittedEssayIsGradedByTheModelInTheBackground() throws Exception {
        when(client.chatConfigured()).thenReturn(true);
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenReturn(generated("{\"points\":9,\"feedback\":\"Khá tốt\"}"));
        String id = essayExam();
        submit(id);
        Awaitility.await().atMost(Duration.ofSeconds(5)).until(() -> score(id) == 10.0);
        tx.executeWithoutResult(s -> assertThat(assessmentDao.find(STUDENT, id).orElseThrow().getAiFeedback())
                .containsExactly("", "Khá tốt"));
        mvc.perform(post("/api/assignments/"+id+"/answer-release").headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(get("/api/assessments").headers(auth(STUDENT)))
                .andExpect(jsonPath("$['" + id + "'].result.aiFeedback[1]").value("Khá tốt"));
    }

    @Test
    void badModelOutputFallsBackToTheRubric() throws Exception {
        when(client.chatConfigured()).thenReturn(true);
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenReturn(generated("{\"feedback\":\"Thiếu điểm\"}"));
        String id = essayExam();
        submit(id);
        mvc.perform(post("/api/assessments/" + id + "/essay-drafts").param("studentId", STUDENT).headers(auth(LECTURER)))
                .andExpect(jsonPath("$[0].mode").value("rubric"))
                .andExpect(jsonPath("$[0].points").value(0.0));
    }

    @Test
    void withoutAModelTheEssayWaitsForTheLecturer() throws Exception {
        String id = essayExam();
        submit(id);
        assertThat(score(id)).isEqualTo(6.0);
    }
}
