package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** A review card or a class FAQ entry. AI writes drafts; a lecturer reviews each one before students see it. */
@Entity
@Table(name = "learning_aids", indexes = @Index(columnList = "course_id, kind"))
@Getter
@Setter
public class LearningAid {

    public static final String CARD = "card";
    public static final String FAQ = "faq";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "course_id", nullable = false, length = 100)
    private String courseId;

    @Column(nullable = false, length = 10)
    private String kind;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String front;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String back;

    @Column(length = 120)
    private String topic;

    @Column(name = "page_no")
    private Integer page;

    private boolean published;

    /** "ai" when drafted by the model, "manual" when written by a lecturer. */
    @Column(length = 10)
    private String origin;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
