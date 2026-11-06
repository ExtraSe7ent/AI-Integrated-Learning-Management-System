package vn.edu.vju.lms.service.impl;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vju.lms.ai.RagIndexJob;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IMaterialDao;
import vn.edu.vju.lms.dao.IMaterialVersionDao;
import vn.edu.vju.lms.dao.IRagChunkDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Material;
import vn.edu.vju.lms.entity.MaterialVersion;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.MaterialService;
import vn.edu.vju.lms.wrapper.MaterialWrapper;

@Service
public class MaterialServiceImpl implements MaterialService {

    private static final Logger log = LoggerFactory.getLogger(MaterialServiceImpl.class);
    private static final byte[] PDF_MAGIC = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final long MEGABYTE = 1024 * 1024;

    private final IMaterialDao materialDao;
    private final IMaterialVersionDao versionDao;
    private final IRagChunkDao chunkDao;
    private final IClassInfoDao classDao;
    private final AesService aesService;
    private final RagIndexJob indexJob;
    private final LmsProperties.Storage storage;

    public MaterialServiceImpl(IMaterialDao materialDao, IMaterialVersionDao versionDao, IRagChunkDao chunkDao,
            IClassInfoDao classDao, AesService aesService, RagIndexJob indexJob, LmsProperties properties) {
        this.materialDao = materialDao;
        this.versionDao = versionDao;
        this.chunkDao = chunkDao;
        this.classDao = classDao;
        this.aesService = aesService;
        this.indexJob = indexJob;
        this.storage = properties.getStorage();
    }

    @Override
    @Transactional
    public MaterialWrapper upload(String classId, String title, int weekNumber, MultipartFile file) {
        requireTeaching(requireClass(classId));
        if (title == null || title.isBlank()) {
            throw new BusinessRuleException("Nhập tiêu đề học liệu.");
        }
        if (weekNumber < 1 || weekNumber > 20) {
            throw new BusinessRuleException("Tuần học phải từ 1 đến 20.");
        }
        Material material = new Material();
        material.setId(UUID.randomUUID().toString());
        material.setClassId(classId);
        material.setTitle(title.trim());
        material.setWeekNumber(weekNumber);
        material.setKind(kindOf(file));
        material.setUploadedBy(UserPrincipal.current().id());
        materialDao.persist(material);
        return store(material, file);
    }

    @Override
    @Transactional
    public MaterialWrapper addVersion(String id, MultipartFile file) {
        Material material = requireMaterial(id);
        requireTeaching(requireClass(material.getClassId()));
        if (!material.getKind().equals(kindOf(file))) {
            throw new BusinessRuleException("Phiên bản mới phải cùng loại với học liệu.");
        }
        material.setIndexStatus(Material.INDEX_NOT_STARTED);
        return store(material, file);
    }

    private MaterialWrapper store(Material material, MultipartFile file) {
        int number = material.getCurrentVersion() + 1;
        Path relative = Path.of("materials", material.getId(), UUID.randomUUID() + ".enc");
        Path target = Path.of(storage.getRoot()).resolve(relative);
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            aesService.encryptFile(in, target);
        } catch (IOException e) {
            throw new UncheckedIOException("Không lưu được tệp.", e);
        }
        MaterialVersion version = new MaterialVersion();
        version.setMaterialId(material.getId());
        version.setNumber(number);
        version.setStoredPath(relative.toString().replace('\\', '/'));
        version.setOriginalName(file.getOriginalFilename());
        version.setFileSize(file.getSize());
        version.setUploadedBy(UserPrincipal.current().id());
        versionDao.persist(version);
        material.setCurrentVersion(number);
        log.info("Stored material {} version {}", material.getId(), number);
        return toWrapper(materialDao.merge(material));
    }

    private String kindOf(MultipartFile file) {
        String name = String.valueOf(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (name.endsWith(".pdf")) {
            checkSize(file, storage.getPdfMaxMb(), "PDF");
            try (InputStream in = new BufferedInputStream(file.getInputStream())) {
                if (!Arrays.equals(in.readNBytes(PDF_MAGIC.length), PDF_MAGIC)) {
                    throw new BusinessRuleException("Tệp không phải PDF hợp lệ.");
                }
            } catch (IOException e) {
                throw new UncheckedIOException("Không đọc được tệp.", e);
            }
            return "pdf";
        }
        if (name.endsWith(".mp4") || name.endsWith(".webm")) {
            checkSize(file, storage.getVideoMaxMb(), "Video");
            return "video";
        }
        throw new BusinessRuleException("Chỉ nhận tệp PDF, MP4 hoặc WebM.");
    }

    private void checkSize(MultipartFile file, long maxMb, String label) {
        if (file.getSize() > maxMb * MEGABYTE) {
            throw new BusinessRuleException(label + " vượt quá " + maxMb + " MB.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaterialWrapper> listByClass(String classId) {
        ClassInfo info = requireClass(classId);
        UserPrincipal user = UserPrincipal.current();
        if (user.isStudent() && !info.getStudentIds().contains(user.id())) {
            throw new ForbiddenOperationException("Bạn không thuộc lớp này.");
        }
        return materialDao.findByClass(classId).stream()
                .filter(material -> !user.isStudent() || Material.PUBLISHED.equals(material.getStatus()))
                .map(this::toWrapper).toList();
    }

    @Override
    @Transactional
    public MaterialWrapper publish(String id) {
        Material material = requireMaterial(id);
        requireTeaching(requireClass(material.getClassId()));
        material.setStatus(Material.PUBLISHED);
        material.setPublishedAt(Instant.now());
        return toWrapper(materialDao.merge(material));
    }

    @Override
    @Transactional
    public MaterialWrapper unpublish(String id) {
        Material material = requireMaterial(id);
        requireTeaching(requireClass(material.getClassId()));
        material.setStatus(Material.DRAFT);
        return toWrapper(materialDao.merge(material));
    }

    @Override
    @Transactional
    public MaterialWrapper requestIndex(String id) {
        Material material = requireMaterial(id);
        requireTeaching(requireClass(material.getClassId()));
        if (!Material.PUBLISHED.equals(material.getStatus()) || !"pdf".equals(material.getKind())) {
            throw new BusinessRuleException("Chọn PDF đã công bố.");
        }
        material.setIndexStatus(Material.INDEX_QUEUED);
        MaterialWrapper wrapper = toWrapper(materialDao.merge(material));
        indexJob.enqueueAfterCommit(id);
        return wrapper;
    }

    @Override
    @Transactional
    public void delete(String id) {
        Material material = requireMaterial(id);
        requireTeaching(requireClass(material.getClassId()));
        chunkDao.deleteByMaterial(id);
        for (MaterialVersion version : versionDao.findByMaterial(id)) {
            try {
                Files.deleteIfExists(Path.of(storage.getRoot()).resolve(version.getStoredPath()));
            } catch (IOException e) {
                log.warn("Could not delete stored file of material {}", id, e);
            }
            versionDao.remove(version);
        }
        materialDao.remove(material);
    }

    @Override
    @Transactional(readOnly = true)
    public String fileName(String id) {
        Material material = requireMaterial(id);
        requireReadable(material);
        return currentVersion(material).getOriginalName();
    }

    @Override
    @Transactional(readOnly = true)
    public void writeFile(String id, OutputStream target) {
        Material material = requireMaterial(id);
        requireReadable(material);
        aesService.decryptFile(Path.of(storage.getRoot()).resolve(currentVersion(material).getStoredPath()), target);
    }

    private void requireReadable(Material material) {
        UserPrincipal user = UserPrincipal.current();
        if (!user.isStudent()) {
            return;
        }
        boolean enrolled = requireClass(material.getClassId()).getStudentIds().contains(user.id());
        if (!enrolled || !Material.PUBLISHED.equals(material.getStatus())) {
            throw new ResourceNotFoundException("Không tìm thấy học liệu.");
        }
    }

    private void requireTeaching(ClassInfo info) {
        UserPrincipal user = UserPrincipal.current();
        boolean allowed = user.role() == Role.ADMIN || user.id().equals(info.getTeacherId()) || user.id().equals(info.getLeaderId());
        if (!allowed) {
            throw new ForbiddenOperationException("Bạn không phụ trách lớp này.");
        }
    }

    private ClassInfo requireClass(String classId) {
        return classDao.findById(classId).orElseThrow(() -> new ResourceNotFoundException("Lớp không tồn tại."));
    }

    private Material requireMaterial(String id) {
        return materialDao.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học liệu."));
    }

    private MaterialVersion currentVersion(Material material) {
        return versionDao.find(material.getId(), material.getCurrentVersion())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tệp học liệu."));
    }

    private MaterialWrapper toWrapper(Material material) {
        MaterialWrapper wrapper = new MaterialWrapper();
        wrapper.setId(material.getId());
        wrapper.setClassId(material.getClassId());
        wrapper.setWeekNumber(material.getWeekNumber());
        wrapper.setKind(material.getKind());
        wrapper.setTitle(material.getTitle());
        wrapper.setStatus(material.getStatus());
        wrapper.setIndexStatus(material.getIndexStatus());
        wrapper.setIndexError(material.getIndexError());
        wrapper.setCurrentVersion(material.getCurrentVersion());
        versionDao.find(material.getId(), material.getCurrentVersion()).ifPresent(version -> {
            wrapper.setOriginalName(version.getOriginalName());
            wrapper.setFileSize(version.getFileSize());
        });
        return wrapper;
    }
}
