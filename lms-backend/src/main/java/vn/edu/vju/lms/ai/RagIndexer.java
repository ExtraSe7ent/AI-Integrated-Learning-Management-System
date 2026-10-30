package vn.edu.vju.lms.ai;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IMaterialDao;
import vn.edu.vju.lms.dao.IMaterialVersionDao;
import vn.edu.vju.lms.dao.IRagChunkDao;
import vn.edu.vju.lms.entity.Material;
import vn.edu.vju.lms.entity.MaterialVersion;
import vn.edu.vju.lms.entity.RagChunk;

/**
 * Port of rag.index_material for PDF text. Without an embedding key the chunks are stored with no vector and
 * only keyword search uses them; indexing again after adding a key fills the vectors in.
 */
@Service
public class RagIndexer {

    private static final Logger log = LoggerFactory.getLogger(RagIndexer.class);
    private static final Duration STALE_AFTER = Duration.ofMinutes(20);

    private final IMaterialDao materialDao;
    private final IMaterialVersionDao versionDao;
    private final IRagChunkDao chunkDao;
    private final AesService aesService;
    private final AiClient client;
    private final TransactionTemplate transaction;
    private final LmsProperties properties;

    public RagIndexer(IMaterialDao materialDao, IMaterialVersionDao versionDao, IRagChunkDao chunkDao,
            AesService aesService, AiClient client, TransactionTemplate transaction, LmsProperties properties) {
        this.materialDao = materialDao;
        this.versionDao = versionDao;
        this.chunkDao = chunkDao;
        this.aesService = aesService;
        this.client = client;
        this.transaction = transaction;
        this.properties = properties;
    }

    public void index(String materialId) {
        Instant now = Instant.now();
        Boolean claimed = transaction.execute(s -> materialDao.claimForIndexing(materialId, now, now.minus(STALE_AFTER)));
        if (!Boolean.TRUE.equals(claimed)) {
            log.info("Material {} is already being indexed", materialId);
            return;
        }
        try {
            Material material = materialDao.findById(materialId).orElseThrow();
            MaterialVersion version = versionDao.find(materialId, material.getCurrentVersion()).orElseThrow();
            List<RagChunk> chunks = readChunks(material, version);
            if (client.embeddingConfigured()) {
                List<String> texts = chunks.stream().map(c -> material.getTitle() + "\n" + c.getText()).toList();
                List<List<Double>> vectors = client.embed(texts);
                for (int i = 0; i < chunks.size(); i++) {
                    chunks.get(i).setEmbedding(vectors.get(i));
                    chunks.get(i).setEmbeddingModel(client.embeddingSignature());
                }
            }
            transaction.executeWithoutResult(s -> {
                chunkDao.deleteByMaterial(materialId);
                chunks.forEach(chunkDao::persist);
                materialDao.findById(materialId).ifPresent(m -> m.setIndexStatus(Material.INDEX_READY));
            });
            log.info("Indexed material {}: {} chunks", materialId, chunks.size());
        } catch (RuntimeException | IOException e) {
            log.warn("Indexing material {} failed", materialId, e);
            String reason = e instanceof BusinessRuleException || e instanceof AiProviderException
                    ? e.getMessage() : "Không đọc hoặc lập chỉ mục được tệp. Kiểm tra tệp rồi thử lại.";
            transaction.executeWithoutResult(s -> materialDao.findById(materialId).ifPresent(m -> {
                m.setIndexStatus(Material.INDEX_FAILED);
                m.setIndexError(reason.length() > 500 ? reason.substring(0, 500) : reason);
            }));
        }
    }

    private List<RagChunk> readChunks(Material material, MaterialVersion version) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        aesService.decryptFile(Path.of(properties.getStorage().getRoot()).resolve(version.getStoredPath()), bytes);
        List<RagChunk> chunks = new ArrayList<>();
        try (PDDocument document = Loader.loadPDF(bytes.toByteArray())) {
            PDFTextStripper stripper = new PDFTextStripper();
            for (int page = 1; page <= document.getNumberOfPages(); page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                List<String> passages = RagAlgorithms.passages(stripper.getText(document), 1400, 200);
                for (int i = 0; i < passages.size(); i++) {
                    chunks.add(chunk(material, version, page, i, passages.get(i)));
                }
            }
        }
        if (chunks.isEmpty()) {
            throw new BusinessRuleException("Không có nội dung chữ để lập chỉ mục.");
        }
        int maximum = properties.getAi().getMaxChunks();
        if (chunks.size() > maximum) {
            throw new BusinessRuleException("Tài liệu vượt giới hạn " + maximum + " đoạn.");
        }
        return chunks;
    }

    private RagChunk chunk(Material material, MaterialVersion version, int page, int index, String text) {
        RagChunk chunk = new RagChunk();
        chunk.setVersionId(version.getId());
        chunk.setMaterialId(material.getId());
        chunk.setMaterialTitle(material.getTitle());
        chunk.setChunkKey("m" + material.getId() + "-v" + version.getNumber() + "-p" + page + "-" + index);
        chunk.setPage(page);
        chunk.setText(text);
        return chunk;
    }
}
