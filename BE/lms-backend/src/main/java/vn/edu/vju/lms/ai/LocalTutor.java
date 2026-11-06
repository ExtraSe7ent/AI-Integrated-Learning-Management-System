package vn.edu.vju.lms.ai;

import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.entity.RagChunk;

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

    private final ILessonDao lessonDao;

    public LocalTutor(ILessonDao lessonDao) {
        this.lessonDao = lessonDao;
    }

    public AiAnswer answer(String courseId, String question, List<RagChunk> chunks) {
        boolean demoTopic = DEMO_COURSE.equals(courseId) && demoMaterialAvailable() && TOPIC.matcher(question).find();
        if (demoTopic) {
            return ruleAnswer(question);
        }
        List<RagChunk> ranked = RagAlgorithms.keywordRanking(chunks, question);
        if (ranked.isEmpty()) {
            return AiAnswer.withoutSources(UNAVAILABLE, "unavailable");
        }
        RagChunk best = ranked.get(0);
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
