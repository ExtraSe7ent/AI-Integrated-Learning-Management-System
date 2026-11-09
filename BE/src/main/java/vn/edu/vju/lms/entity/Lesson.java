package vn.edu.vju.lms.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

@Entity
@Table(name = "lessons")
@Getter
@Setter
public class Lesson {

    @Id
    @Column(length = 100)
    private String id;

    private String classId;

    private String title;

    @Column(name = "sort_order")
    private Integer order;

    private Boolean published;

    private Boolean activity;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> slides;

    @Column(length = 500)
    private String video;

    /** Week of the term the lesson is taught in (1–20). */
    private Integer week;

    /** Lecture PDF uploaded for this lesson (a Material of the lesson's class) and its file name. */
    @Column(length = 100)
    private String materialId;

    @Column(length = 255)
    private String pdfName;
}
