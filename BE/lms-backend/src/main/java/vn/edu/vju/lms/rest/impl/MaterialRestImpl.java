package vn.edu.vju.lms.rest.impl;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import vn.edu.vju.lms.rest.MaterialRest;
import vn.edu.vju.lms.service.MaterialService;
import vn.edu.vju.lms.wrapper.MaterialWrapper;

@RestController
public class MaterialRestImpl implements MaterialRest {

    private final MaterialService service;

    public MaterialRestImpl(MaterialService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<MaterialWrapper> upload(String classId, String title, int weekNumber, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upload(classId, title, weekNumber, file));
    }

    @Override
    public ResponseEntity<MaterialWrapper> addVersion(String id, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addVersion(id, file));
    }

    @Override
    public ResponseEntity<List<MaterialWrapper>> list(String classId) {
        return ResponseEntity.ok(service.listByClass(classId));
    }

    @Override
    public ResponseEntity<MaterialWrapper> publish(String id) {
        return ResponseEntity.ok(service.publish(id));
    }

    @Override
    public ResponseEntity<MaterialWrapper> unpublish(String id) {
        return ResponseEntity.ok(service.unpublish(id));
    }

    @Override
    public ResponseEntity<MaterialWrapper> index(String id) {
        return ResponseEntity.accepted().body(service.requestIndex(id));
    }

    @Override
    public ResponseEntity<StreamingResponseBody> file(String id) {
        String name = service.fileName(id);
        // The body runs on another thread, which does not inherit the caller's security context.
        SecurityContext context = SecurityContextHolder.getContext();
        StreamingResponseBody body = out -> {
            SecurityContextHolder.setContext(context);
            try {
                service.writeFile(id, out);
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
        return ResponseEntity.ok()
                .contentType(MediaTypeFactory.getMediaType(name).orElse(MediaType.APPLICATION_OCTET_STREAM))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(name, StandardCharsets.UTF_8).build().toString())
                .body(body);
    }

    @Override
    public ResponseEntity<Void> delete(String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
