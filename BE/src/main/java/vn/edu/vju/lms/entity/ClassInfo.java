package vn.edu.vju.lms.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "class_info")
@Getter
@Setter
public class ClassInfo {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "course_id", nullable = false, length = 100)
    private String courseId;

    @Column(nullable = false)
    private String name;

    @Column(length = 10)
    private String term;

    @Column(name = "academic_year", length = 20)
    private String year;

    @Column(name = "enroll_round", length = 10)
    private String round;

    @Column(name = "teacher_id", length = 50)
    private String teacherId;

    @Column(name = "leader_id", length = 50)
    private String leaderId;

    @ElementCollection
    @CollectionTable(name = "class_enrollments", joinColumns = @JoinColumn(name = "class_id"))
    @Column(name = "student_id", length = 50)
    private List<String> studentIds = new ArrayList<>();
}
