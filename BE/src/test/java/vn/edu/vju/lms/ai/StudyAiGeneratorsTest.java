package vn.edu.vju.lms.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.entity.RagChunk;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.PageReport;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Insights;

class StudyAiGeneratorsTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final AiClient client = mock(AiClient.class);

    private static Map<Integer, String> pages(int count) {
        Map<Integer, String> pages = new LinkedHashMap<>();
        for (int page = 1; page <= count; page++) {
            pages.put(page, "Nội dung trang " + page);
        }
        return pages;
    }

    @Test
    void composeKeepsTheFrameAndFormulaLines() {
        assertThat(LessonExplainer.compose("  Ý   chính  ", "", "Chốt lại.")).isEqualTo("Ý chính\nÝ chính\n\nTóm tắt\nChốt lại.");
        assertThat(LessonExplainer.compose("Công thức\n$$E = mc^2$$", null, null)).isEqualTo("Ý chính\nCông thức\n$$E = mc^2$$");
    }

    @Test
    void oneFailedBatchDoesNotLoseTheOthers() throws Exception {
        when(client.chatJson(any(), anyString(), anyString(), anyInt()))
                .thenThrow(new AiProviderException("HTTP 503"))
                .thenReturn(mapper.readTree("[{\"page\":5,\"main\":\"Trang năm giải thích đủ dài để được giữ lại.\"},"
                        + "{\"page\":6,\"main\":\"Ngắn\"}]"));
        Map<Integer, String> result = new LessonExplainer(client, mapper).explain(pages(6), List.of(1, 2, 3, 4, 5, 6));
        assertThat(result).containsOnlyKeys(5);
    }

    @Test
    void everyBatchFailingIsAnError() {
        when(client.chatJson(any(), anyString(), anyString(), anyInt())).thenThrow(new AiProviderException("HTTP 503"));
        LessonExplainer explainer = new LessonExplainer(client, mapper);
        assertThatThrownBy(() -> explainer.explain(pages(2), List.of(1, 2))).isInstanceOf(AiProviderException.class);
        assertThat(explainer.explain(pages(2), List.of())).isEmpty();
    }

    @Test
    void statisticsRankTheWeakestPagesFirst() {
        Insights insights = ClassInsightsGenerator.fromStatistics(List.of(
                new PageReport(1, 10, 1, 0), new PageReport(2, 10, 5, 1), new PageReport(3, 10, 0, 0)));
        assertThat(insights.mode()).isEqualTo("rules");
        assertThat(insights.themes()).extracting(theme -> theme.pages().get(0)).containsExactly(2, 1);
        assertThat(insights.summary()).contains("2, 1");
    }

    @Test
    void spreadKeepsSmallContextsWhole() {
        List<RagChunk> chunks = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            RagChunk chunk = new RagChunk();
            chunk.setPage(i + 1);
            chunks.add(chunk);
        }
        assertThat(StudyAidGenerator.spread(chunks.subList(0, 5))).hasSize(5);
        List<RagChunk> spread = StudyAidGenerator.spread(chunks);
        assertThat(spread).hasSize(StudyAidGenerator.MAX_SOURCES);
        assertThat(spread.get(0).getPage()).isEqualTo(1);
        assertThat(spread.get(spread.size() - 1).getPage()).isEqualTo(30);
    }

    @Test
    void searchFallsBackToKeywordsWhenEmbeddingFails() {
        RagAnswerService rag = new RagAnswerService(client, mock(GuardrailService.class),
                mock(vn.edu.vju.lms.dao.IMaterialDao.class), mock(vn.edu.vju.lms.dao.IMaterialVersionDao.class),
                mock(vn.edu.vju.lms.dao.IRagChunkDao.class), mapper);
        RagChunk chunk = new RagChunk();
        chunk.setPage(1);
        chunk.setChunkKey("k1");
        chunk.setText("PATCH cập nhật một phần tài nguyên");
        chunk.setEmbeddingModel("sig");
        chunk.setEmbedding(List.of(1.0));
        assertThat(rag.search("PATCH", List.of(), 3)).isEmpty();
        when(client.embeddingSignature()).thenReturn("other");
        assertThat(rag.search("PATCH", List.of(chunk), 3)).containsExactly(chunk);
        when(client.embeddingSignature()).thenReturn("sig");
        when(client.embed(any())).thenThrow(new AiProviderException("HTTP 500"));
        assertThat(rag.search("PATCH", List.of(chunk), 3)).containsExactly(chunk);
    }

    private static RagChunk passage(String key, int page, String text) {
        RagChunk chunk = new RagChunk();
        chunk.setChunkKey(key);
        chunk.setPage(page);
        chunk.setText(text);
        chunk.setMaterialTitle("Bài giảng");
        return chunk;
    }

    @Test
    void offTopicQuestionsGetNoPassageAndTheCurrentPageIsPreferred() {
        LocalTutor tutor = new LocalTutor(mock(vn.edu.vju.lms.dao.ILessonDao.class));
        List<RagChunk> chunks = List.of(passage("a", 1, "Demo learning material. The week starts here."),
                passage("b", 2, "JWT gồm ba phần: header, payload (mã, vai trò, thời hạn) và signature."),
                passage("c", 4, "Mỗi JWT có phần signature để kiểm tra."));
        assertThat(tutor.answer("cs204", "Thời tiết hôm nay thế nào?", chunks).mode()).isEqualTo("unavailable");
        assertThat(tutor.answer("cs204", "là gì vậy?", chunks).mode()).isEqualTo("unavailable");
        assertThat(tutor.answer("cs204", "JWT gồm mấy phần?", chunks).page()).isEqualTo(2);
        assertThat(tutor.answer("cs204", "JWT signature", chunks, 4).page()).isEqualTo(4);
        assertThat(tutor.answer("cs204", "JWT signature", chunks).page()).isEqualTo(2);
    }

    @Test
    void theSlideBeingReadIsAlwaysInTheContext() {
        RagChunk read = passage("p3", 3, "Trang ba");
        RagChunk found = passage("p1", 1, "Trang một");
        List<RagChunk> all = List.of(found, read);
        assertThat(RagAnswerService.withPage(List.of(found), all, 3)).containsExactly(read, found);
        assertThat(RagAnswerService.withPage(List.of(found), all, null)).containsExactly(found);
        assertThat(RagAnswerService.withPage(List.of(found, read), all, 3)).containsExactly(found, read);
        assertThat(RagAnswerService.withPage(List.of(found), all, 9)).containsExactly(found);
    }

    @Test
    void examOrderMapsBothWays() {
        int[] order = {2, 0, 1};
        List<String> original = List.of("a", "b", "c");
        assertThat(vn.edu.vju.lms.service.ExamOrder.toStudent(original, order)).containsExactly("c", "a", "b");
        assertThat(vn.edu.vju.lms.service.ExamOrder.toOriginal(List.of("c", "a", "b"), order)).containsExactly("a", "b", "c");
        assertThat(vn.edu.vju.lms.service.ExamOrder.toStudent(List.of("x"), order)).containsExactly("x");
        assertThat(vn.edu.vju.lms.service.ExamOrder.toOriginal(null, order)).isNull();
        assertThat(vn.edu.vju.lms.service.ExamOrder.originalIndex(0, order)).isEqualTo(2);
        assertThat(vn.edu.vju.lms.service.ExamOrder.originalIndex(7, order)).isEqualTo(7);
        assertThat(vn.edu.vju.lms.service.ExamOrder.shownIndex(2, order)).isZero();
        assertThat(vn.edu.vju.lms.service.ExamOrder.shownIndex(9, order)).isEqualTo(9);
    }

    @Test
    void pageTextsJoinChunksInOrder() {
        RagChunk first = new RagChunk();
        first.setPage(2);
        first.setText("A");
        RagChunk second = new RagChunk();
        second.setPage(1);
        second.setText("B");
        RagChunk third = new RagChunk();
        third.setPage(2);
        third.setText("C");
        assertThat(RagAlgorithms.pageTexts(List.of(first, second, third))).containsExactly(Map.entry(1, "B"), Map.entry(2, "A\nC"));
    }
}
