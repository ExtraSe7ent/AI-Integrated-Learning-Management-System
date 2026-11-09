package vn.edu.vju.lms.rest.impl;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.CoordinationCompletionRest;
import vn.edu.vju.lms.service.CoordinationCompletionService;

@RestController
public class CoordinationCompletionRestImpl implements CoordinationCompletionRest {

    private final CoordinationCompletionService service;

    public CoordinationCompletionRestImpl(CoordinationCompletionService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<Void> complete(String classId) {
        service.complete(classId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> reopen(String classId) {
        service.reopen(classId);
        return ResponseEntity.noContent().build();
    }
}
