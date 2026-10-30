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

/** The projected in-class quiz; the frontend runs one session at a time. */
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

    @Column(name = "expires_at")
    private long expiresAt;

    @Convert(converter = JsonConverters.IntegerMap.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Integer> answers = new HashMap<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> participants = new ArrayList<>();
}
