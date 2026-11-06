package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;
import vn.edu.vju.lms.entity.ExamQuestion;

@Data
public class AssignmentWrapper {

    private String id;

    @NotBlank
    private String title;

    private Integer minutes;

    private String opens;

    private String closes;

    private Boolean published;

    private Boolean preventPaste;

    private Integer attempts;

    private Boolean random;

    private List<ExamQuestion> questions;
}
