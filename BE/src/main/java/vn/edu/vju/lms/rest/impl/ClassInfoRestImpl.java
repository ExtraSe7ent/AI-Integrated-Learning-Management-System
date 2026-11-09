package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.ClassInfoRest;
import vn.edu.vju.lms.service.ClassInfoService;
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;

@RestController
public class ClassInfoRestImpl implements ClassInfoRest {

    private static final Logger log = LoggerFactory.getLogger(ClassInfoRestImpl.class);

    private final ClassInfoService classInfoService;

    public ClassInfoRestImpl(ClassInfoService classInfoService) {
        this.classInfoService = classInfoService;
    }

    @Override
    public ResponseEntity<ClassInfoWrapper> get(String id) {
        log.debug("Get class {}", id);
        return ResponseEntity.ok(classInfoService.get(id));
    }

    @Override
    public ResponseEntity<ClassInfoWrapper> getByName(String name) {
        return ResponseEntity.ok(classInfoService.getByName(name));
    }

    @Override
    public ResponseEntity<List<ClassInfoWrapper>> list() {
        return ResponseEntity.ok(classInfoService.listAll());
    }

    @Override
    public ResponseEntity<PageResponse<ClassInfoWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(classInfoService.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<ClassInfoWrapper> create(ClassInfoWrapper wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classInfoService.create(wrapper));
    }

    @Override
    public ResponseEntity<ClassInfoWrapper> update(String id, ClassInfoWrapper wrapper) {
        return ResponseEntity.ok(classInfoService.update(id, wrapper));
    }

    @Override
    public ResponseEntity<ClassInfoWrapper> enroll(String id, List<String> studentIds) {
        return ResponseEntity.ok(classInfoService.enroll(id, studentIds));
    }

    @Override
    public ResponseEntity<Void> delete(String id) {
        classInfoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Long> count() {
        return ResponseEntity.ok(classInfoService.count());
    }
}
