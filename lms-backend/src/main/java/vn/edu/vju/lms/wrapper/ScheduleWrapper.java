package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScheduleWrapper {

    private String id;

    @NotBlank
    private String classId;

    @NotBlank
    private String dayOfWeek;

    @NotBlank
    private String startTime;

    @NotBlank
    private String endTime;

    private String room;

    private Integer periodCount;
}
