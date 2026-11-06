package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
public class StudySession {

    @Id
    @Column(length = 100)
    private String id;

    private String title;

    private String opens;

    private String closes;

    private Boolean published;

    private Boolean late;
}
