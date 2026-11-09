package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "schedules")
@Getter
@Setter
public class Schedule {

    @Id
    @Column(length = 100)
    private String id;

    private String classId;

    private String dayOfWeek;

    private String startTime;

    private String endTime;

    private String room;

    private Integer periodCount;
}
