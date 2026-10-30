package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttendanceWrapper {

    private String id;

    @NotBlank
    private String classId;

    @NotBlank
    private String studentId;

    @NotBlank
    private String date;

    @NotBlank
    private String status;
}
