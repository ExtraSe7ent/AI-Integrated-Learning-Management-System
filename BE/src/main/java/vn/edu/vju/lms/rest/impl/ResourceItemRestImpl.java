package vn.edu.vju.lms.rest.impl;

import java.util.List;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.ResourceItemRest;
import vn.edu.vju.lms.service.ResourceItemService;
import vn.edu.vju.lms.wrapper.ResourceItemWrapper;

@RestController
public class ResourceItemRestImpl implements ResourceItemRest {

    private final ResourceItemService service;

    public ResourceItemRestImpl(ResourceItemService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<ResourceItemWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<ResourceItemWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<ResourceItemWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<ResourceItemWrapper> create(ResourceItemWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<ResourceItemWrapper> update(String id, ResourceItemWrapper wrapper) {
        return ResponseEntity.ok(service.update(id, wrapper));
    }

    @Override
    public ResponseEntity<Void> delete(String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Long> count() {
        return ResponseEntity.ok(service.count());
    }

    @Override
    public ResponseEntity<ResourceItemWrapper> upload(String title, String description, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upload(title, description, file));
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
                        ContentDisposition.attachment().filename(name, StandardCharsets.UTF_8).build().toString())
                .body(body);
    }
}
