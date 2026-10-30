package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "change_requests")
@Getter
@Setter
public class ChangeRequest {

    @Id
    @Column(length = 100)
    private String id;

    private String itemId;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String reply;

    private Boolean closed;
}
