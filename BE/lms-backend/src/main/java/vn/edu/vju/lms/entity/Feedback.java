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
@Table(name = "feedback")
@Getter
@Setter
public class Feedback {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "owner_id", length = 50)
    private String ownerId;

    private String student;

    private String course;

    private String lesson;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> images;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> imageIds;

    @Column(columnDefinition = "TEXT")
    private String response;

    private Boolean resolved;

    @Column(name = "sent_date")
    private String date;
}
