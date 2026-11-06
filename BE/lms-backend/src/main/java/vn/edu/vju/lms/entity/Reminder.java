package vn.edu.vju.lms.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

@Entity
@Table(name = "reminders")
@Getter
@Setter
public class Reminder {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "reminder_key", length = 500)
    private String key;

    private String createdAt;

    @Convert(converter = JsonConverters.ObjectMap.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Object> candidate;

    private String channel;

    private String status;
}
