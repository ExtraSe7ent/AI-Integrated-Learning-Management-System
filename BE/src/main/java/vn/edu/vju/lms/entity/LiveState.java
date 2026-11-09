package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

/** The projected in-class quiz; one session runs at a time and gets a fresh code each time it starts. */
@Entity
@Table(name = "live_state")
@Getter
@Setter
public class LiveState {

    public static final String SINGLETON_ID = "default";

    @Id
    @Column(length = 20)
    private String id = SINGLETON_ID;

    @Column(length = 20)
    private String code = "261016";

    private boolean active;

    private int question;

    private boolean revealed;

    /** Class the session runs for; only its students may join (UC-C01 "chọn lớp"). */
    @Column(name = "class_id", length = 100)
    private String classId;

    /** The approved question on the board (UC-C01 "chọn câu hỏi"). */
    @Column(name = "question_id", length = 100)
    private String questionId;

    /** New for each start; groups the saved results of one class session. */
    @Column(name = "run_id", length = 64)
    private String runId;

    @Column(name = "expires_at")
    private long expiresAt;

    @Convert(converter = JsonConverters.IntegerMap.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Integer> answers = new HashMap<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> participants = new ArrayList<>();
}
