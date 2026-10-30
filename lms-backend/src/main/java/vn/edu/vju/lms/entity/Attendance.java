package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "attendances")
@Getter
@Setter
public class Attendance {

    @Id
    @Column(length = 100)
    private String id;

    private String classId;

    private String studentId;

    @Column(name = "session_date")
    private String date;

    private String status;
}
