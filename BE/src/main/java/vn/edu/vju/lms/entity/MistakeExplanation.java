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

/** Cached explanation of one wrong answer, so asking again for the same attempt costs no model call. */
@Entity
@Table(name = "mistake_explanations")
@Getter
@Setter
public class MistakeExplanation {

    /** studentId:assignmentId:attempt:questionIndex; a new attempt never reuses an old explanation. */
    @Id
    @Column(length = 220)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String answer;

    @Convert(converter = JsonConverters.IntegerList.class)
    @Column(columnDefinition = "TEXT")
    private List<Integer> pages;

    @Column(length = 20)
    private String mode;
}
