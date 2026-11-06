package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "resources")
@Getter
@Setter
public class ResourceItem {

    @Id
    @Column(length = 100)
    private String id;

    private String title;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String url;

    private String kind;

    /** Display order chosen by the lecturer; smaller first. */
    private Integer position;

    /** Uploaded files only: encrypted copy under the storage root, and the original name for download. */
    @Column(name = "stored_path", length = 300)
    private String storedPath;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;
}
