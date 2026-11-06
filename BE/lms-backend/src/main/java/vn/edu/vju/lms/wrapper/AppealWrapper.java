package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AppealWrapper {

    private String id;

    private String ownerId;

    @NotBlank
    private String assignmentId;

    private String question;

    private String reason;

    private String response;

    private Double grade;

    private String status;

    private Integer questionIndex;

    private String answer;

    private Double previousPoints;

    private Double maxPoints;
}
