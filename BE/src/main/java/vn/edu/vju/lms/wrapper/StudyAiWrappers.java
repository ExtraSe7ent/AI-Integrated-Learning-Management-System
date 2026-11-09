package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Requests and responses of the flipped-classroom AI tools ported from lesson_ai.py and study_support.py. */
public final class StudyAiWrappers {

    private StudyAiWrappers() {
    }

    // Bài giảng AI

    public record Explanation(String id, String courseId, int page, String content, boolean published, boolean edited,
            String updatedAt) {
    }

    /** Null pages means every indexed page that has no explanation yet. */
    public record ExplainRequest(List<Integer> pages, boolean overwriteEdited) {
    }

    public record ExplanationUpdate(@Size(max = 6000) String content, Boolean published) {
    }

    // Gợi ý buổi học

    public record InsightsRequest(String courseId) {
    }

    public record Theme(String title, List<Integer> pages, String explanation) {
    }

    public record Discussion(String question, String why, List<Integer> pages) {
    }

    /** mode is "ai" for a model-written plan and "rules" for the statistics-only fallback. */
    public record Insights(String mode, String summary, List<Theme> themes, List<Discussion> discussion,
            List<String> activities) {
    }

    // Giải thích câu sai

    public record MistakeRequest(String courseId, @NotBlank String assignmentId, @NotNull Integer questionIndex) {
    }

    /** mode is "ai" for a grounded explanation, "extractive" for the related passage only. */
    public record MistakeExplanationWrapper(String answer, List<Integer> pages, String mode) {
    }

    // Thẻ ôn và FAQ

    public record Aid(String id, String courseId, String kind, String front, String back, String topic, Integer page,
            boolean published, String origin, ReviewState review) {
    }

    /** A student's schedule for one card; null for staff and for cards never reviewed. */
    public record ReviewState(int repetitions, int intervalDays, String dueAt, boolean due) {
    }

    public record AidGenerateRequest(String courseId, @NotBlank String kind) {
    }

    public record AidCreate(String courseId, @NotBlank String kind, @NotBlank @Size(max = 500) String front,
            @NotBlank @Size(max = 4000) String back, @Size(max = 120) String topic, Integer page) {
    }

    public record AidUpdate(@Size(max = 500) String front, @Size(max = 4000) String back, @Size(max = 120) String topic,
            Boolean published) {
    }

    public record ReviewRequest(boolean remembered) {
    }
}
