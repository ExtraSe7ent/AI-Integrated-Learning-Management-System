package vn.edu.vju.lms.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IFeedbackImageDao;
import vn.edu.vju.lms.entity.FeedbackImage;
import vn.edu.vju.lms.security.UserPrincipal;

/**
 * UC-E01 step 4: at most five evidence images, 5 MB in total. The type is read from the file's first bytes, not
 * its name, so a renamed file is refused. Only the student who uploaded an image and staff may read it.
 */
@Service
public class FeedbackImageService {

    public static final int MAX_FILES = 5;
    public static final long MAX_TOTAL = 5L * 1024 * 1024;

    private final IFeedbackImageDao dao;
    private final AesService aesService;
    private final LmsProperties.Storage storage;

    public FeedbackImageService(IFeedbackImageDao dao, AesService aesService, LmsProperties properties) {
        this.dao = dao;
        this.aesService = aesService;
        this.storage = properties.getStorage();
    }

    @Transactional
    public List<String> upload(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BusinessRuleException("Chọn ảnh đính kèm.");
        }
        if (files.size() > MAX_FILES) {
            throw new BusinessRuleException("Chọn tối đa 5 ảnh.");
        }
        if (files.stream().mapToLong(MultipartFile::getSize).sum() > MAX_TOTAL) {
            throw new BusinessRuleException("Tổng dung lượng ảnh không được vượt quá 5 MB.");
        }
        List<String> types = files.stream().map(FeedbackImageService::imageType).toList();
        String owner = UserPrincipal.current().id();
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            FeedbackImage image = new FeedbackImage();
            image.setId(UUID.randomUUID().toString());
            image.setOwnerId(owner);
            image.setFileName(Path.of(String.valueOf(file.getOriginalFilename())).getFileName().toString());
            image.setContentType(types.get(i));
            image.setFileSize(file.getSize());
            Path relative = Path.of("feedback", image.getId() + ".enc");
            Path target = Path.of(storage.getRoot()).resolve(relative);
            try (InputStream in = file.getInputStream()) {
                Files.createDirectories(target.getParent());
                aesService.encryptFile(in, target);
            } catch (IOException e) {
                throw new UncheckedIOException("Không lưu được ảnh.", e);
            }
            image.setStoredPath(relative.toString().replace('\\', '/'));
            dao.persist(image);
            ids.add(image.getId());
        }
        return ids;
    }

    /** Feedback may only reference images the caller uploaded. */
    @Transactional(readOnly = true)
    public void requireOwned(List<String> ids) {
        String owner = UserPrincipal.current().id();
        for (String id : ids) {
            if (dao.findById(id).filter(image -> owner.equals(image.getOwnerId())).isEmpty()) {
                throw new BusinessRuleException("Ảnh đính kèm không hợp lệ. Hãy chọn lại ảnh.");
            }
        }
    }

    @Transactional(readOnly = true)
    public FeedbackImage readable(String id) {
        FeedbackImage image = dao.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh."));
        UserPrincipal user = UserPrincipal.current();
        if (user.isStudent() && !user.id().equals(image.getOwnerId())) {
            throw new ForbiddenOperationException("Bạn chỉ xem được ảnh của mình.");
        }
        return image;
    }

    public void write(FeedbackImage image, OutputStream out) {
        aesService.decryptFile(Path.of(storage.getRoot()).resolve(image.getStoredPath()), out);
    }

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G'};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] GIF = {'G', 'I', 'F', '8'};

    static String imageType(MultipartFile file) {
        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(12);
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được ảnh.", e);
        }
        if (starts(head, PNG)) {
            return "image/png";
        }
        if (starts(head, JPEG)) {
            return "image/jpeg";
        }
        if (starts(head, GIF)) {
            return "image/gif";
        }
        if (head.length >= 12 && starts(head, new byte[] {'R', 'I', 'F', 'F'})
                && Arrays.equals(Arrays.copyOfRange(head, 8, 12), new byte[] {'W', 'E', 'B', 'P'})) {
            return "image/webp";
        }
        throw new BusinessRuleException("Chỉ chấp nhận tệp hình ảnh (PNG, JPEG, WebP, GIF).");
    }

    private static boolean starts(byte[] head, byte[] magic) {
        return head.length >= magic.length && Arrays.equals(Arrays.copyOf(head, magic.length), magic);
    }
}
