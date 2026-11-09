package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.ReferenceItemRest;
import vn.edu.vju.lms.service.ReferenceItemService;
import vn.edu.vju.lms.wrapper.ReferenceItemWrapper;

@RestController
public class ReferenceItemRestImpl implements ReferenceItemRest {

    private final ReferenceItemService service;

    public ReferenceItemRestImpl(ReferenceItemService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<ReferenceItemWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<ReferenceItemWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<ReferenceItemWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<ReferenceItemWrapper> create(ReferenceItemWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<ReferenceItemWrapper> update(String id, ReferenceItemWrapper wrapper) {
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
