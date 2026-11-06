package vn.edu.vju.lms.wrapper;

import java.util.Map;
import lombok.Data;

@Data
public class ReminderWrapper {

    private String id;

    private String key;

    private String createdAt;

    private Map<String, Object> candidate;

    private String channel;

    private String status;
}
