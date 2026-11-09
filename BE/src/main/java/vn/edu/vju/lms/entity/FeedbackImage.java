package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** An evidence image attached to feedback (UC-E01), stored encrypted so the lecturer sees it from any device. */
@Entity
@Table(name = "feedback_images")
@Getter
@Setter
public class FeedbackImage {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "content_type", length = 40)
    private String contentType;

    @Column(name = "file_size")
    private long fileSize;

    @Column(name = "stored_path", nullable = false, length = 300)
    private String storedPath;
}
