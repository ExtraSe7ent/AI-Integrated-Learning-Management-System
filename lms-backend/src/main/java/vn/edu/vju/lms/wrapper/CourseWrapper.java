package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourseWrapper {

    private String id;

    @NotBlank
    private String code;

    @NotBlank
    private String title;

    @NotBlank
    private String faculty;
}
