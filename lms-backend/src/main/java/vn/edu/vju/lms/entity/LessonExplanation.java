package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/**
 * "Bài giảng AI" for one page of a course's lesson material, in the Ý chính / Ví dụ / Tóm tắt frame.
 * Students only see it once a lecturer publishes it; a lecturer's edit is kept when drafts are regenerated.
 */
@Entity
@Table(name = "lesson_explanations")
@Getter
@Setter
public class LessonExplanation {

    /** courseId + ":" + page, so one page has one explanation. */
    @Id
    @Column(length = 120)
    private String id;

    @Column(name = "course_id", nullable = false, length = 100)
    private String courseId;

    @Column(name = "page_no", nullable = false)
    private int page;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private boolean published;

    /** True once a lecturer changed the text by hand. */
    private boolean edited;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public static String key(String courseId, int page) {
        return courseId + ":" + page;
    }
}
