package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class ClassInfoWrapper {

    private String id;

    @NotBlank
    private String courseId;

    @NotBlank
    private String name;

    private String term;

    private String year;

    private String round;

    private String teacherId;

    private String leaderId;

    private List<String> studentIds;
}
