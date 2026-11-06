package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "knowledge_gaps")
@Getter
@Setter
public class KnowledgeGap {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "owner_id", length = 50)
    private String ownerId;

    @Column(name = "page_no")
    private Integer page;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String response;
}
