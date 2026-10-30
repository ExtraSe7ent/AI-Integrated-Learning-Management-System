package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** Uploaded teaching file (Django's TeachingMaterial); the bytes live encrypted in private storage. */
@Entity
@Table(name = "materials")
@Getter
@Setter
public class Material {

    public static final String DRAFT = "draft";
    public static final String PUBLISHED = "published";
    public static final String INDEX_NOT_STARTED = "not_started";
    public static final String INDEX_QUEUED = "queued";
    public static final String INDEX_PROCESSING = "processing";
    public static final String INDEX_READY = "ready";
    public static final String INDEX_FAILED = "failed";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "class_id", nullable = false, length = 50)
    private String classId;

    @Column(name = "week_number")
    private int weekNumber = 1;

    @Column(length = 10)
    private String kind = "pdf";

    @Column(nullable = false)
    private String title;

    @Column(length = 20)
    private String status = DRAFT;

    @Column(name = "index_status", length = 20)
    private String indexStatus = INDEX_NOT_STARTED;

    @Column(name = "index_started_at")
    private Instant indexStartedAt;

    @Column(name = "index_error", length = 500)
    private String indexError = "";

    @Column(name = "current_version")
    private int currentVersion;

    @Column(name = "uploaded_by", length = 50)
    private String uploadedBy;

    @Column(name = "published_at")
    private Instant publishedAt;
}
