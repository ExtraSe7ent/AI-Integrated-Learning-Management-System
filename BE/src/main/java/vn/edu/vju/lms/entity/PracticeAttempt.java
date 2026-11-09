package vn.edu.vju.lms.entity;

import java.util.List;
import lombok.Data;

/** Practice is deliberately separate from the first, official submission. */
@Data
public class PracticeAttempt {
    private List<String> answers;
    private List<Double> questionPoints;
    private Double score;
    private String submitted;
}
