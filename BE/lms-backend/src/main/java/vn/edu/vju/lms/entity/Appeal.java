package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "appeals")
@Getter
@Setter
public class Appeal {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "owner_id", length = 50)
    private String ownerId;

    private String assignmentId;

    @Column(columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String response;

    private Double grade;

    private String status;

    private Integer questionIndex;

    @Column(columnDefinition = "TEXT")
    private String answer;

    private Double previousPoints;

    private Double maxPoints;
}
