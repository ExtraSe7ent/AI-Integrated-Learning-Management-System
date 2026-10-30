package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.FeedbackRest;
import vn.edu.vju.lms.service.FeedbackService;
import vn.edu.vju.lms.wrapper.FeedbackWrapper;

@RestController
public class FeedbackRestImpl implements FeedbackRest {

    private final FeedbackService service;

    public FeedbackRestImpl(FeedbackService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<FeedbackWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<FeedbackWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<FeedbackWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<FeedbackWrapper> create(FeedbackWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<FeedbackWrapper> update(String id, FeedbackWrapper wrapper) {
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
