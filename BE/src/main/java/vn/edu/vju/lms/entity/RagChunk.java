package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

/** A searchable passage of one material version. Vectors are compared in memory, as in the Django app. */
@Entity
@Table(name = "rag_chunks")
@Getter
@Setter
public class RagChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version_id", nullable = false)
    private Long versionId;

    @Column(name = "material_id", nullable = false, length = 100)
    private String materialId;

    @Column(name = "material_title")
    private String materialTitle;

    @Column(name = "chunk_key", nullable = false, unique = true, length = 160)
    private String chunkKey;

    @Column(name = "page_no")
    private int page;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Convert(converter = JsonConverters.DoubleList.class)
    @Column(columnDefinition = "TEXT")
    private List<Double> embedding;

    @Column(name = "embedding_model", length = 160)
    private String embeddingModel;
}
