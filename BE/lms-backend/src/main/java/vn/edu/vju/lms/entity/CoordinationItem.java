package vn.edu.vju.lms.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.crypto.EncryptedStringConverter;

@Entity
@Table(name = "coordination_items")
@Getter
@Setter
public class CoordinationItem {

    @Id
    @Column(length = 100)
    private String id;

    private String courseId;

    private String classId;

    private String kind;

    private String title;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "review_level")
    private Integer level;

    private Boolean editable;

    private Integer revision;
}
