package vn.edu.vju.lms.wrapper;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KnowledgeGapWrapper {

    private String id;

    private String ownerId;

    private Integer page;

    @NotBlank
    private String body;

    private String response;
}
