package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.NoticeRest;
import vn.edu.vju.lms.service.NoticeService;
import vn.edu.vju.lms.wrapper.NoticeWrapper;

@RestController
public class NoticeRestImpl implements NoticeRest {

    private final NoticeService service;

    public NoticeRestImpl(NoticeService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<NoticeWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<NoticeWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<NoticeWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<NoticeWrapper> create(NoticeWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<NoticeWrapper> update(String id, NoticeWrapper wrapper) {
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
}
