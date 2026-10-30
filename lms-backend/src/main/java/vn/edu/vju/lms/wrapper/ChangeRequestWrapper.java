package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeRequestWrapper {

    private String id;

    @NotBlank
    private String itemId;

    @NotBlank
    private String body;

    private String reply;

    private Boolean closed;
}
