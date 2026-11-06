package vn.edu.vju.lms.ai;

import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.entity.RagChunk;
import vn.edu.vju.lms.service.TextNormalizer;

/** Answers with no AI provider: the frontend's rule-based CSE301 tutor, then an extractive passage search. */
@Component
public class LocalTutor {

    public static final String UNAVAILABLE = "Chưa có học liệu phù hợp để trả lời câu hỏi này. Hãy kiểm tra học phần hoặc gửi câu hỏi cho giảng viên.";

    private static final String DEMO_COURSE = "cs301";
    private static final String DEMO_LESSON = "l2";
    private static final List<String> DEMO_SLIDES = List.of(
            "RESTful API là gì?", "Tài nguyên và HTTP methods", "Mã trạng thái HTTP", "Thiết kế API trong thực tế");
    private static final Pattern TOPIC = Pattern.compile("rest|api|http|uri|tài nguyên|method|put|patch|post|get|mã trạng thái|bài giảng", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern CHEATING = Pattern.compile("giải hộ|làm hộ|đáp án.*(thi|kiểm tra)|bài kiểm tra đang", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern METHODS = Pattern.compile("put|patch|method|post|get", Pattern.CASE_INSENSITIVE);
    private static final Pattern STATUS = Pattern.compile("mã|status|201|404|lỗi", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    /** Common Vietnamese and English words, accent-folded like the search tokens. */
    static final java.util.Set<String> STOP_WORDS = java.util.Set.of(
            "la", "gi", "nao", "the", "nhu", "co", "khong", "cua", "va", "cho", "toi", "em", "ban", "minh", "hay",
            "duoc", "nay", "hom", "do", "thi", "sao", "vay", "a", "an", "is", "are", "what", "how", "why", "of", "to",
            "in", "on", "and", "or", "be", "it", "this", "that", "may", "mot", "nhung", "cac", "voi", "trong",
            "vi", "khi", "ve", "di", "lam", "giup", "hoi", "oi", "nhe", "day", "kia", "ay");

    private final ILessonDao lessonDao;

    public LocalTutor(ILessonDao lessonDao) {
        this.lessonDao = lessonDao;
    }

    public AiAnswer answer(String courseId, String question, List<RagChunk> chunks) {
        return answer(courseId, question, chunks, null);
    }

    public AiAnswer answer(String courseId, String question, List<RagChunk> chunks, Integer page) {
        boolean demoTopic = DEMO_COURSE.equals(courseId) && demoMaterialAvailable() && TOPIC.matcher(question).find();
        if (demoTopic) {
            return ruleAnswer(question);
        }
        // UC-B04 EX-1: only content words count, and a passage must share at least half of them; otherwise
        // a folded "thế" would match the English "the" and an off-topic question would get a random passage.
        java.util.Set<String> terms = new java.util.LinkedHashSet<>(TextNormalizer.tokens(question));
        terms.removeAll(STOP_WORDS);
        if (terms.isEmpty()) {
            return AiAnswer.withoutSources(UNAVAILABLE, "unavailable");
        }
        // Short questions must match every content word ("thời tiết" is not "thời hạn"); longer ones at least half.
        int needed = terms.size() <= 2 ? terms.size() : (terms.size() + 1) / 2;
        List<RagChunk> ranked = RagAlgorithms.keywordRanking(chunks, String.join(" ", terms)).stream()
                .filter(c -> terms.stream().filter(TextNormalizer.tokens(c.getText())::contains).count() >= needed)
                .toList();
        if (ranked.isEmpty()) {
            return AiAnswer.withoutSources(UNAVAILABLE, "unavailable");
        }
        // Among matching passages, prefer the slide the student is reading.
        RagChunk best = ranked.stream().filter(c -> page != null && c.getPage() == page).findFirst().orElse(ranked.get(0));
        return new AiAnswer("Đoạn liên quan trong \"" + best.getMaterialTitle() + "\": " + best.getText(),
                best.getPage(), List.of(best.getPage()), "extractive");
    }

    private AiAnswer ruleAnswer(String question) {
        if (CHEATING.matcher(question).find()) {
            return AiAnswer.withoutSources("Mình có thể giải thích khái niệm và chỉ ra học liệu để bạn tự làm. Không cung cấp đáp án thay cho bạn trong bài kiểm tra đang diễn ra.", "guardrail_hint");
        }
        if (METHODS.matcher(question).find()) {
            return page("GET đọc tài nguyên; POST tạo mới; PUT thay thế toàn bộ biểu diễn, còn PATCH cập nhật một phần. Ví dụ PATCH /books/1 chỉ thay thuộc tính title. Đối chiếu trang 2 và thử giải thích vì sao PATCH phù hợp với ví dụ này.", 2);
        }
        if (STATUS.matcher(question).find()) {
            return page("Nhóm 2xx biểu thị thành công, 4xx là lỗi yêu cầu, 5xx là lỗi máy chủ. POST tạo tài nguyên thành công thường trả 201 Created; không tìm thấy tài nguyên trả 404. Đối chiếu trang 3.", 3);
        }
        return page("REST tổ chức API quanh tài nguyên. Mỗi tài nguyên được định danh bằng URI; HTTP method thể hiện thao tác. Ví dụ GET /books để đọc danh sách sách. Đối chiếu trang 1.", 1);
    }

    private AiAnswer page(String answer, int page) {
        return new AiAnswer(answer, page, List.of(page), "rules");
    }

    private boolean demoMaterialAvailable() {
        return lessonDao.findById(DEMO_LESSON)
                .filter(lesson -> Boolean.TRUE.equals(lesson.getPublished()))
                .filter(lesson -> lesson.getSlides() == null || DEMO_SLIDES.equals(lesson.getSlides()))
                .isPresent();
    }
}
