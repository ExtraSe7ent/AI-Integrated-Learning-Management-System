package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class FeedbackWrapper {

    private String id;

    private String ownerId;

    private String student;

    private String course;

    private String lesson;

    private String category;

    @NotBlank
    private String body;

    private List<String> images;

    private List<String> imageIds;

    private String response;

    private Boolean resolved;

    private String date;
}
