package vn.edu.vju.lms.rest.impl;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.AnalyticsRest;
import vn.edu.vju.lms.service.AnalyticsService;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.Report;

@RestController
public class AnalyticsRestImpl implements AnalyticsRest {

    private final AnalyticsService service;

    public AnalyticsRestImpl(AnalyticsService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<Report> report() {
        return ResponseEntity.ok(service.report());
    }
}
