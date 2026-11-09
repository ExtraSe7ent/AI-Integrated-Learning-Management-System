package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "coordination_references")
@Getter
@Setter
public class ReferenceItem {

    @Id
    @Column(length = 100)
    private String id;

    private String courseId;

    private String title;

    @Column(length = 500)
    private String url;
}
