package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

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
}
