package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class QuestionWrapper {

    private String id;

    @NotBlank
    private String text;

    @NotEmpty
    private List<String> options;

    private Integer correct;

    private String explanation;

    private Integer page;

    private Boolean approved;
}
