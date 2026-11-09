package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ChatWrappers {

    private ChatWrappers() {
    }

    /** page is the slide the student is reading (UC-B04 step 3); its passages are always part of the context. */
    public record AskRequest(String courseId, @NotBlank @Size(max = 2000) String question, Integer page) {
    }

    public record RatingRequest(String rating) {
    }

    public record ChatMessageWrapper(String id, String question, String answer, int page, String courseId,
            List<Integer> sources, String rating) {
    }

    /** Pages are inclusive; a null bound leaves that end of the range open. */
    public record PracticeRequest(String courseId, Integer fromPage, Integer toPage, int round) {
    }

    public record GeneratedQuestion(String id, String type, int page, String title, List<String> options, String answer,
            String explanation) {
    }

    /** mode is "ai" for generated questions and "bank" for ones taken from the approved question bank. */
    public record PracticeSet(String mode, List<GeneratedQuestion> questions) {
    }
}
