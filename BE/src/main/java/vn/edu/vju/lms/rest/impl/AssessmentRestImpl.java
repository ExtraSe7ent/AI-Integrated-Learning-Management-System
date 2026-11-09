package vn.edu.vju.lms.rest.impl;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.ai.EssayGrader;
import vn.edu.vju.lms.rest.AssessmentRest;
import vn.edu.vju.lms.service.AssessmentService;
import vn.edu.vju.lms.wrapper.AssessmentWrapper;

@RestController
public class AssessmentRestImpl implements AssessmentRest {

    private final AssessmentService service;

    public AssessmentRestImpl(AssessmentService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<Map<String, AssessmentWrapper>> list() {
        return ResponseEntity.ok(service.visibleToCurrentUser());
    }

    @Override
    public ResponseEntity<AssessmentWrapper> save(String assignmentId, AssessmentWrapper wrapper) {
        return ResponseEntity.ok(service.save(assignmentId, wrapper));
    }

    @Override
    public ResponseEntity<List<AssessmentWrapper>> submissions(String assignmentId) {
        return ResponseEntity.ok(service.submissions(assignmentId));
    }

    @Override
    public ResponseEntity<List<EssayGrader.Draft>> essayDrafts(String assignmentId, String studentId) {
        return ResponseEntity.ok(service.essayDrafts(assignmentId, studentId));
    }
}
