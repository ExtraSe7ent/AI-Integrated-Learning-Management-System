package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

@Entity
@Table(name = "study_progress")
@Getter
@Setter
public class StudyProgress {

    @Id
    @Column(length = 160)
    private String id;

    @Column(name = "student_id", nullable = false, length = 50)
    private String studentId;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    private int progress;

    @Convert(converter = JsonConverters.IntegerMap.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Integer> answers;

    @Column(name = "completed_at")
    private String completedAt;
}
