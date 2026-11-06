package vn.edu.vju.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One question of an assignment, stored as JSON on the assignment. {@code correct} holds the option index
 * for choice, the accepted answers separated by | for blank, and the rubric for essay.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestion {

    public static final String CHOICE = "choice";
    public static final String BLANK = "blank";
    public static final String ESSAY = "essay";

    private String type;
    private String text;
    private List<String> options;
    private String correct;
    private Double points;
    private String explanation;

    @JsonIgnore
    public boolean isEssay() {
        return ESSAY.equals(type);
    }

    /** What a student may see while the attempt is open: no answer key, rubric or explanation. */
    public ExamQuestion withoutAnswer() {
        return new ExamQuestion(type, text, options, null, points, null);
    }

    /** After submitting, the key and explanation are shown; an essay rubric stays with the staff. */
    public ExamQuestion forReview() {
        return isEssay() ? new ExamQuestion(type, text, options, null, points, explanation) : this;
    }
}
