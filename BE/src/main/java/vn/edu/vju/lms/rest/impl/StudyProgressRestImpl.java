package vn.edu.vju.lms.rest.impl;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.StudyProgressRest;
import vn.edu.vju.lms.service.StudyProgressService;
import vn.edu.vju.lms.wrapper.StudyProgressWrapper;

@RestController
public class StudyProgressRestImpl implements StudyProgressRest {

    private final StudyProgressService service;

    public StudyProgressRestImpl(StudyProgressService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<Map<String, StudyProgressWrapper>> list() {
        return ResponseEntity.ok(service.visibleToCurrentUser());
    }

    @Override
    public ResponseEntity<StudyProgressWrapper> save(String sessionId, StudyProgressWrapper wrapper) {
        return ResponseEntity.ok(service.save(sessionId, wrapper));
    }

    @Override
    public ResponseEntity<StudyProgressService.QuizResult> answer(String sessionId, AnswerRequest request) {
        if (request.questionId() == null || request.choice() == null) {
            throw new vn.edu.vju.lms.common.exception.BusinessRuleException("Chọn một đáp án.");
        }
        return ResponseEntity.ok(service.answer(sessionId, request.questionId(), request.choice()));
    }
}
