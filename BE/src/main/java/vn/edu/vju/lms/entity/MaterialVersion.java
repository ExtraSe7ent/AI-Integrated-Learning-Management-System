package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "material_versions", uniqueConstraints = @UniqueConstraint(columnNames = {"material_id", "version_number"}))
@Getter
@Setter
public class MaterialVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "material_id", nullable = false, length = 100)
    private String materialId;

    @Column(name = "version_number", nullable = false)
    private int number;

    @Column(name = "stored_path", nullable = false, length = 500)
    private String storedPath;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "file_size")
    private long fileSize;

    @Column(name = "uploaded_by", length = 50)
    private String uploadedBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
