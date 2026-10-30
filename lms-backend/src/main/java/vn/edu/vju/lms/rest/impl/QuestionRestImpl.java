package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.QuestionRest;
import vn.edu.vju.lms.service.QuestionService;
import vn.edu.vju.lms.wrapper.QuestionWrapper;

@RestController
public class QuestionRestImpl implements QuestionRest {

    private final QuestionService service;

    public QuestionRestImpl(QuestionService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<QuestionWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<QuestionWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<QuestionWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<QuestionWrapper> create(QuestionWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<QuestionWrapper> update(String id, QuestionWrapper wrapper) {
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
