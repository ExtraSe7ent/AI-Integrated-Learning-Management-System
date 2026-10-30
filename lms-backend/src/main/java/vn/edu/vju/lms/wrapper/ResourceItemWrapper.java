package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResourceItemWrapper {

    private String id;

    @NotBlank
    private String title;

    private String description;

    private String url;

    private String kind;
}
