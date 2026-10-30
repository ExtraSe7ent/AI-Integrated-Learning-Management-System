package vn.edu.vju.lms.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

@Entity
@Table(name = "questions")
@Getter
@Setter
public class Question {

    @Id
    @Column(length = 100)
    private String id;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> options;

    private Integer correct;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "page_no")
    private Integer page;

    private Boolean approved;
}
