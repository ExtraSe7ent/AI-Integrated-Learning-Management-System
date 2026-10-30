package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "assignments")
@Getter
@Setter
public class Assignment {

    @Id
    @Column(length = 100)
    private String id;

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
}
