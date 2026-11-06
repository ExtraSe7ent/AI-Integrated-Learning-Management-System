package vn.edu.vju.lms.rest.impl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import vn.edu.vju.lms.entity.FeedbackImage;
import vn.edu.vju.lms.service.FeedbackImageService;

@Tag(name = "Ảnh phản hồi")
@RestController
@RequestMapping("/api/feedback-images")
public class FeedbackImageRestImpl {

    private final FeedbackImageService service;

    public FeedbackImageRestImpl(FeedbackImageService service) {
        this.service = service;
    }

    @Operation(summary = "Tải lên tối đa 5 ảnh minh chứng (tổng 5 MB); trả về mã ảnh để gắn vào phản hồi")
    @PreAuthorize("isAuthenticated()")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<String>> upload(@RequestPart("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upload(files));
    }

    @Operation(summary = "Xem ảnh minh chứng; sinh viên chỉ xem được ảnh của mình")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<StreamingResponseBody> read(@PathVariable String id) {
        FeedbackImage image = service.readable(id);
        // The body runs on another thread, which does not inherit the caller's security context.
        SecurityContext context = SecurityContextHolder.getContext();
        StreamingResponseBody body = out -> {
            SecurityContextHolder.setContext(context);
            try {
                service.write(image, out);
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.noStore()).body(body);
    }
}
