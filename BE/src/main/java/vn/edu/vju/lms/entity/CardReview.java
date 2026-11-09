package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** One student's spaced-repetition state for one card. Fixed intervals: scheduling, not an AI estimate of mastery. */
@Entity
@Table(name = "card_reviews", indexes = @Index(columnList = "student_id"))
@Getter
@Setter
public class CardReview {

    /** studentId + ":" + aidId. */
    @Id
    @Column(length = 160)
    private String id;

    @Column(name = "student_id", nullable = false, length = 50)
    private String studentId;

    @Column(name = "aid_id", nullable = false, length = 100)
    private String aidId;

    private int repetitions;

    @Column(name = "interval_days")
    private int intervalDays;

    @Column(name = "due_at", nullable = false)
    private Instant dueAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    public static String key(String studentId, String aidId) {
        return studentId + ":" + aidId;
    }
}
