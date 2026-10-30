package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ChatWrappers {

    private ChatWrappers() {
    }

    public record AskRequest(String courseId, @NotBlank @Size(max = 2000) String question) {
    }

    public record RatingRequest(String rating) {
    }

    public record ChatMessageWrapper(String id, String question, String answer, int page, String courseId,
            List<Integer> sources, String rating) {
    }
}
