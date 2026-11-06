package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.ChangeRequestRest;
import vn.edu.vju.lms.service.ChangeRequestService;
import vn.edu.vju.lms.wrapper.ChangeRequestWrapper;

@RestController
public class ChangeRequestRestImpl implements ChangeRequestRest {

    private final ChangeRequestService service;

    public ChangeRequestRestImpl(ChangeRequestService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<ChangeRequestWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<ChangeRequestWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<ChangeRequestWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<ChangeRequestWrapper> create(ChangeRequestWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<ChangeRequestWrapper> update(String id, ChangeRequestWrapper wrapper) {
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
