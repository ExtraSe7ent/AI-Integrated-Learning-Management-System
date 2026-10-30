package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.KnowledgeGapRest;
import vn.edu.vju.lms.service.KnowledgeGapService;
import vn.edu.vju.lms.wrapper.KnowledgeGapWrapper;

@RestController
public class KnowledgeGapRestImpl implements KnowledgeGapRest {

    private final KnowledgeGapService service;

    public KnowledgeGapRestImpl(KnowledgeGapService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<KnowledgeGapWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<KnowledgeGapWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<KnowledgeGapWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<KnowledgeGapWrapper> create(KnowledgeGapWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<KnowledgeGapWrapper> update(String id, KnowledgeGapWrapper wrapper) {
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
