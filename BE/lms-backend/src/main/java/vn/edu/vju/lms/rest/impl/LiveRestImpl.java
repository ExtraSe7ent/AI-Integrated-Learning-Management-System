package vn.edu.vju.lms.rest.impl;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.LiveRest;
import vn.edu.vju.lms.service.LiveService;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveControl;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResponse;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStateWrapper;

@RestController
public class LiveRestImpl implements LiveRest {

    private final LiveService service;

    public LiveRestImpl(LiveService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<LiveStateWrapper> state() {
        return ResponseEntity.ok(service.state());
    }

    @Override
    public ResponseEntity<LiveStateWrapper> control(LiveControl control) {
        return ResponseEntity.ok(service.control(control));
    }

    @Override
    public ResponseEntity<LiveStateWrapper> respond(LiveResponse response) {
        return ResponseEntity.ok(service.respond(response));
    }
}
