package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notices")
@Getter
@Setter
public class Notice {

    @Id
    @Column(length = 100)
    private String id;

    private String audience;

    @Column(length = 500)
    private String message;

    private String createdAt;
}
