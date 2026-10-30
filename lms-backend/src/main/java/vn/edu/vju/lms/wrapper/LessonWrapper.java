package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class LessonWrapper {

    private String id;

    private String classId;

    @NotBlank
    private String title;

    private Integer order;

    private Boolean published;

    private Boolean activity;

    private List<String> slides;

    private String video;
}
