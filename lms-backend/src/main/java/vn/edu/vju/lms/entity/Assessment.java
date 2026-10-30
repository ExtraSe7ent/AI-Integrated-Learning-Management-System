package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

/** One student's work on one assignment: the running draft plus the latest graded result. */
@Entity
@Table(name = "assessments", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "assignment_id"}))
@Getter
@Setter
public class Assessment {

    @Id
    @Column(length = 160)
    private String id;

    @Column(name = "student_id", nullable = false, length = 50)
    private String studentId;

    @Column(name = "assignment_id", nullable = false, length = 100)
    private String assignmentId;

    private int attempts;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(name = "draft_answers", columnDefinition = "TEXT")
    private List<String> draftAnswers;

    @Column(name = "draft_deadline")
    private Long draftDeadline;

    private Double score;

    @Convert(converter = JsonConverters.DoubleList.class)
    @Column(name = "question_points", columnDefinition = "TEXT")
    private List<Double> questionPoints;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> answers;

    private String submitted;

    private Boolean approved;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
