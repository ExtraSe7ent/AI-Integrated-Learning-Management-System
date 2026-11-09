package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "coordination_completions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoordinationCompletion {

    @Id
    @Column(name = "class_id", length = 50)
    private String classId;
}
