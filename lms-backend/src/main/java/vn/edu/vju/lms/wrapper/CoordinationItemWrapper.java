package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CoordinationItemWrapper {

    private String id;

    @NotBlank
    private String courseId;

    @NotBlank
    private String classId;

    @NotBlank
    private String kind;

    @NotBlank
    private String title;

    @NotBlank
    private String body;

    private Integer level;

    private Boolean editable;

    private Integer revision;
}
