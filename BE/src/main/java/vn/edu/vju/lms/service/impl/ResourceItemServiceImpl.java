package vn.edu.vju.lms.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IResourceItemDao;
import vn.edu.vju.lms.entity.ResourceItem;
import vn.edu.vju.lms.service.ResourceItemService;
import vn.edu.vju.lms.wrapper.ResourceItemWrapper;

/**
 * UC-A04 / UC-B08: reference material as a link, a YouTube video or an uploaded file. Files are encrypted on disk
 * like lesson materials and only reach a logged-in user through {@link #writeFile}.
 */
@Service
public class ResourceItemServiceImpl extends AbstractCrudService<ResourceItem, ResourceItemWrapper> implements ResourceItemService {

    public static final String LINK = "link";
    public static final String VIDEO = "video";
    public static final String PDF = "pdf";
    public static final String FILE = "file";
    static final int TITLE_MAX = 200;
    private static final long MEGABYTE = 1024L * 1024L;
    private static final Set<String> EXTENSIONS = Set.of("pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "zip",
            "png", "jpg", "jpeg");

    private final IResourceItemDao dao;
    private final AesService aesService;
    private final LmsProperties.Storage storage;

    public ResourceItemServiceImpl(IResourceItemDao dao, AesService aesService, LmsProperties properties) {
        this.dao = dao;
        this.aesService = aesService;
        this.storage = properties.getStorage();
    }

    @Override
    protected IGenericDao<String, ResourceItem> dao() {
        return dao;
    }

    @Override
    protected ResourceItem newEntity() {
        return new ResourceItem();
    }

    @Override
    protected ResourceItemWrapper toWrapper(ResourceItem entity) {
        ResourceItemWrapper wrapper = new ResourceItemWrapper();
        wrapper.setId(entity.getId());
        wrapper.setTitle(entity.getTitle());
        wrapper.setDescription(entity.getDescription());
        wrapper.setUrl(entity.getUrl());
        wrapper.setKind(entity.getKind());
        wrapper.setPosition(entity.getPosition());
        wrapper.setFileName(entity.getFileName());
        wrapper.setFileSize(entity.getFileSize());
        return wrapper;
    }

    /** Uploaded files keep their server-made url and kind; only text and order are editable. */
    @Override
    protected void mapWrapperToEntity(ResourceItemWrapper wrapper, ResourceItem entity) {
        boolean uploaded = StringUtils.hasText(entity.getStoredPath());
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle().trim());
        }
        if (wrapper.getDescription() != null) {
            entity.setDescription(wrapper.getDescription().trim());
        }
        if (wrapper.getUrl() != null && !uploaded) {
            entity.setUrl(wrapper.getUrl().trim());
        }
        if (wrapper.getKind() != null && !uploaded) {
            entity.setKind(wrapper.getKind());
        }
        if (wrapper.getPosition() != null) {
            entity.setPosition(wrapper.getPosition());
        }
    }

    @Override
    protected String wrapperId(ResourceItemWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(ResourceItem entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy tài liệu.";
    }

    @Override
    protected void beforeCreate(ResourceItemWrapper wrapper, ResourceItem entity) {
        if (entity.getKind() == null) {
            entity.setKind(LINK);
        }
        if (entity.getPosition() == null) {
            entity.setPosition(nextPosition());
        }
    }

    @Override
    protected void beforeSave(ResourceItem entity) {
        if (!StringUtils.hasText(entity.getTitle()) || entity.getTitle().length() > TITLE_MAX) {
            throw new BusinessRuleException("Tên tài liệu bắt buộc và tối đa " + TITLE_MAX + " ký tự.");
        }
        if (entity.getDescription() != null && entity.getDescription().length() > 500) {
            throw new BusinessRuleException("Mô tả ngắn tối đa 500 ký tự.");
        }
        if (StringUtils.hasText(entity.getStoredPath())) {
            return;
        }
        String url = String.valueOf(entity.getUrl());
        switch (String.valueOf(entity.getKind())) {
            case LINK, PDF -> {
                // Seeded demo PDFs are served by the frontend itself, so a site-relative path is allowed.
                if (!url.matches("^https?://\\S+$") && !url.matches("^/[\\w./-]+$")) {
                    throw new BusinessRuleException("Liên kết phải bắt đầu bằng https:// hoặc http://.");
                }
            }
            case VIDEO -> {
                if (!url.matches("^https://(www\\.|m\\.)?(youtube\\.com|youtu\\.be)/\\S+$")) {
                    throw new BusinessRuleException("Video phải là liên kết YouTube.");
                }
            }
            default -> throw new BusinessRuleException("Loại tài liệu phải là link, video hoặc pdf; tệp được thêm qua upload.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResourceItemWrapper> listAll() {
        return dao.findAll().stream()
                // Rows from before ordering existed (no position) come first, so new ones always join at the end.
                .sorted(Comparator.comparing((ResourceItem r) -> r.getPosition() == null ? 0 : r.getPosition())
                        .thenComparing(r -> String.valueOf(r.getTitle())))
                .map(this::toWrapper).toList();
    }

    @Override
    @Transactional
    public ResourceItemWrapper upload(String title, String description, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Chọn tệp tài liệu.");
        }
        String name = Path.of(String.valueOf(file.getOriginalFilename())).getFileName().toString();
        String extension = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        if (!EXTENSIONS.contains(extension)) {
            throw new BusinessRuleException("Chỉ nhận tệp " + String.join(", ", EXTENSIONS.stream().sorted().toList()) + ".");
        }
        if (file.getSize() > storage.getPdfMaxMb() * MEGABYTE) {
            throw new BusinessRuleException("Tệp vượt quá " + storage.getPdfMaxMb() + " MB.");
        }
        ResourceItem item = new ResourceItem();
        item.setId(UUID.randomUUID().toString());
        item.setTitle(StringUtils.hasText(title) ? title.trim() : name);
        item.setDescription(description == null ? "" : description.trim());
        item.setKind("pdf".equals(extension) ? PDF : FILE);
        item.setUrl("/api/resources/" + item.getId() + "/file");
        item.setPosition(nextPosition());
        Path relative = Path.of("resources", item.getId() + ".enc");
        Path target = Path.of(storage.getRoot()).resolve(relative);
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            aesService.encryptFile(in, target);
        } catch (IOException e) {
            throw new UncheckedIOException("Không lưu được tệp.", e);
        }
        item.setStoredPath(relative.toString().replace('\\', '/'));
        item.setFileName(name);
        item.setFileSize(file.getSize());
        beforeSave(item);
        log.info("Stored reference file {} ({} bytes)", item.getId(), file.getSize());
        return toWrapper(dao.persist(item));
    }

    @Override
    @Transactional(readOnly = true)
    public String fileName(String id) {
        return requireFile(id).getFileName();
    }

    @Override
    @Transactional(readOnly = true)
    public void writeFile(String id, OutputStream out) {
        aesService.decryptFile(Path.of(storage.getRoot()).resolve(requireFile(id).getStoredPath()), out);
    }

    @Override
    protected void checkDelete(ResourceItem entity) {
        if (StringUtils.hasText(entity.getStoredPath())) {
            try {
                Files.deleteIfExists(Path.of(storage.getRoot()).resolve(entity.getStoredPath()));
            } catch (IOException e) {
                log.warn("Could not delete reference file {}", entity.getStoredPath(), e);
            }
        }
    }

    private ResourceItem requireFile(String id) {
        ResourceItem item = require(id);
        if (!StringUtils.hasText(item.getStoredPath())) {
            throw new ResourceNotFoundException("Tài liệu này là liên kết, không có tệp để tải.");
        }
        return item;
    }

    private int nextPosition() {
        return dao.findAll().stream().map(ResourceItem::getPosition).filter(p -> p != null).max(Integer::compare).orElse(0) + 1;
    }
}
