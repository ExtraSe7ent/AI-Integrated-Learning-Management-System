package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

@Entity
@Table(name = "assignments")
@Getter
@Setter
public class Assignment {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "class_id", length = 100)
    private String classId;

    private Boolean answersReleased;

    private String title;

    private Integer minutes;

    private String opens;

    private String closes;

    private Boolean published;

    private Boolean preventPaste;

    @Column(name = "max_attempts")
    private Integer attempts;

    @Column(name = "randomized")
    private Boolean random;

    /** Null on assignments created before exams were configurable; those use the default template. */
    @Convert(converter = JsonConverters.ExamQuestionList.class)
    @Column(columnDefinition = "TEXT")
    private List<ExamQuestion> questions;
}
