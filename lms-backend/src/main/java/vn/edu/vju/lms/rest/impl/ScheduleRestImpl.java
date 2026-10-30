package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.ScheduleRest;
import vn.edu.vju.lms.service.ScheduleService;
import vn.edu.vju.lms.wrapper.ScheduleWrapper;

@RestController
public class ScheduleRestImpl implements ScheduleRest {

    private final ScheduleService service;

    public ScheduleRestImpl(ScheduleService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<ScheduleWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<ScheduleWrapper>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<ScheduleWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<ScheduleWrapper> create(ScheduleWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(wrapper));
    }

    @Override
    public ResponseEntity<ScheduleWrapper> update(String id, ScheduleWrapper wrapper) {
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
