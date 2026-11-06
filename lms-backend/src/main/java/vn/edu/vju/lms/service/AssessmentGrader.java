package vn.edu.vju.lms.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.entity.ExamQuestion;

/**
 * Scores an exam. Multiple choice and fill-in are graded here; an essay stays at 0 until the AI grader or the
 * lecturer sets its points, as in quiz_grading.py.
 */
public final class AssessmentGrader {

    public static final List<ExamQuestion> DEFAULT_QUESTIONS = List.of(
            new ExamQuestion(ExamQuestion.CHOICE, "Trong kiến trúc REST, tài nguyên được định danh bằng gì?",
                    List.of("Một URI duy nhất", "Một kết nối TCP", "Một bảng trong database", "Một phiên đăng nhập"),
                    "0", 4.0, "Tài nguyên được định danh bằng URI."),
            new ExamQuestion(ExamQuestion.BLANK, "Điền HTTP method dùng để tạo tài nguyên mới.", null,
                    "POST", 3.0, "POST được dùng để tạo tài nguyên mới."),
            new ExamQuestion(ExamQuestion.ESSAY,
                    "Thiết kế API cho thao tác mượn sách. Đề xuất endpoint, method và mã trạng thái phản hồi, giải thích lựa chọn của bạn.",
                    null, "Có endpoint cho lượt mượn = loans|borrow; Chọn method POST = post; Nêu mã phản hồi = 201|created",
                    3.0, "Gợi ý: POST /api/loans, trả về 201 khi tạo lượt mượn thành công."));

    private AssessmentGrader() {
    }

    public static List<ExamQuestion> questionsOf(Assignment assignment) {
        List<ExamQuestion> questions = assignment.getQuestions();
        return questions == null || questions.isEmpty() ? DEFAULT_QUESTIONS : questions;
    }

    public static List<Double> grade(List<String> answers) {
        return grade(DEFAULT_QUESTIONS, answers);
    }

    public static List<Double> grade(List<ExamQuestion> questions, List<String> answers) {
        List<Double> points = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            ExamQuestion question = questions.get(i);
            points.add(isCorrect(question, i < answers.size() ? answers.get(i) : null) ? question.getPoints() : 0.0);
        }
        return points;
    }

    public static boolean isCorrect(ExamQuestion question, String answer) {
        if (answer == null || question.isEssay()) {
            return false;
        }
        if (ExamQuestion.CHOICE.equals(question.getType())) {
            return question.getCorrect().equals(answer);
        }
        String given = TextNormalizer.forComparison(answer);
        return !given.isEmpty() && Arrays.stream(question.getCorrect().split("\\|"))
                .map(TextNormalizer::forComparison).anyMatch(given::equals);
    }

    public static double total(List<Double> points) {
        return Math.round(points.stream().mapToDouble(Double::doubleValue).sum() * 10) / 10.0;
    }
}
