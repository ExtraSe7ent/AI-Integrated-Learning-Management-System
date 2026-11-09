package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

@Entity
@Table(name = "chat_messages", indexes = @Index(columnList = "owner_id, created_at"))
@Getter
@Setter
public class ChatMessage {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;

    @Column(name = "course_id", length = 100)
    private String courseId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "page_no")
    private int page;

    @Convert(converter = JsonConverters.IntegerList.class)
    @Column(columnDefinition = "TEXT")
    private List<Integer> sources;

    @Column(length = 20)
    private String rating;

    @Column(length = 30)
    private String mode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
