package vn.edu.vju.lms.wrapper;

import java.util.List;
import java.util.Map;

public final class LiveWrappers {

    private LiveWrappers() {
    }

    /**
     * code is only sent to staff, so a student must be in the room to join. A student's answers and participants
     * contain only themself; distribution, correct and explanation appear once the question is revealed.
     */
    public record LiveStateWrapper(boolean active, String code, int question, boolean revealed, long expiresAt,
            Map<String, Integer> answers, List<String> participants, String classId, String questionId,
            LiveQuestion current, Integer correct, String explanation, List<Integer> distribution, int answered) {
    }

    public record LiveQuestion(String id, String text, List<String> options) {
    }

    public record LiveControl(Boolean active, Integer question, Boolean revealed, Long expiresAt, Boolean reset,
            String classId, String questionId) {
    }

    public record LiveResponse(boolean join, Integer answer, String code) {
    }

    /** One question asked in class, for the lecturer's results page. */
    public record LiveResultWrapper(String id, String runId, String classId, String questionId, String questionText,
            List<String> options, Integer correct, long askedAt, int participants, int answered, int correctCount,
            List<Integer> distribution, List<LiveStudentAnswer> students) {
    }

    /** answer is -1 when time ran out without an answer. */
    public record LiveStudentAnswer(String studentId, String name, int answer, boolean correct) {
    }
}
