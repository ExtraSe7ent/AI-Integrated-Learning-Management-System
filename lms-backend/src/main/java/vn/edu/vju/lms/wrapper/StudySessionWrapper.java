package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StudySessionWrapper {

    private String id;

    @NotBlank
    private String title;

    private String opens;

    private String closes;

    private Boolean published;

    private Boolean late;
}
