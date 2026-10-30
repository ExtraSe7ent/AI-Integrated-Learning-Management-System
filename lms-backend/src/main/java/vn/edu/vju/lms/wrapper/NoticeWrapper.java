package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NoticeWrapper {

    private String id;

    @NotBlank
    private String audience;

    @NotBlank
    private String message;

    private String createdAt;
}
