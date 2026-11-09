package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReferenceItemWrapper {

    private String id;

    @NotBlank
    private String courseId;

    @NotBlank
    private String title;

    @NotBlank
    private String url;
}
