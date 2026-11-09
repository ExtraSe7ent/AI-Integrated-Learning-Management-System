package vn.edu.vju.lms.wrapper;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.Data;

/** Same shape as the frontend's Assessment; draft and result must serialize as null, not be omitted. */
@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
public class AssessmentWrapper {

    private String studentId;

    private String studentName;

    private int attempts;

    private Draft draft;

    private Result result;

    private List<Result> practiceResults;

    @Data
    public static class Draft {
        private List<String> answers;
        private Long deadline;
        private String mode;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Result {
        private Double score;
        private List<Double> questionPoints;
        private List<String> answers;
        private String submitted;
        private Boolean approved;
        private String comment;
        private List<String> aiFeedback;
    }
}
