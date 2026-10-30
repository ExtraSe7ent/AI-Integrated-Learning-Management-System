package vn.edu.vju.lms.wrapper;

import java.util.List;
import java.util.Map;

public final class LiveWrappers {

    private LiveWrappers() {
    }

    public record LiveStateWrapper(boolean active, String code, int question, boolean revealed, long expiresAt,
            Map<String, Integer> answers, List<String> participants) {
    }

    public record LiveControl(Boolean active, Integer question, Boolean revealed, Long expiresAt, Boolean reset) {
    }

    public record LiveResponse(boolean join, Integer answer) {
    }
}
