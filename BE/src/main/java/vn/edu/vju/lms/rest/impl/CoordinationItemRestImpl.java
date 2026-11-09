package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.CoordinationItemRest;
import vn.edu.vju.lms.service.CoordinationItemService;
import vn.edu.vju.lms.wrapper.CoordinationItemWrapper;

@RestController
public class CoordinationItemRestImpl implements CoordinationItemRest {

    private final CoordinationItemService service;

    public CoordinationItemRestImpl(CoordinationItemService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<CoordinationItemWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<CoordinationItemWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<CoordinationItemWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<CoordinationItemWrapper> create(CoordinationItemWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<CoordinationItemWrapper> update(String id, CoordinationItemWrapper wrapper) {
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
