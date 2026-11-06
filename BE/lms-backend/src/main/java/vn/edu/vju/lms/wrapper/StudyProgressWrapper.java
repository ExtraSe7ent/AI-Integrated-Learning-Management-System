package vn.edu.vju.lms.wrapper;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
public class StudyProgressWrapper {

    private int progress;

    private Map<String, Integer> answers;

    private String completedAt;
}
