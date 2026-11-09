package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.StudyAiRest;
import vn.edu.vju.lms.service.StudyAiService;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Aid;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidCreate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidGenerateRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplainRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Explanation;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplanationUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Insights;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.InsightsRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeExplanationWrapper;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ReviewRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ReviewState;

@RestController
public class StudyAiRestImpl implements StudyAiRest {

    private final StudyAiService service;

    public StudyAiRestImpl(StudyAiService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<List<Explanation>> explanations(String courseId) {
        return ResponseEntity.ok(service.explanations(courseId));
    }

    @Override
    public ResponseEntity<List<Explanation>> generateExplanations(String courseId, ExplainRequest request) {
        return ResponseEntity.ok(service.generateExplanations(courseId, request));
    }

    @Override
    public ResponseEntity<Explanation> updateExplanation(String courseId, int page, ExplanationUpdate update) {
        return ResponseEntity.ok(service.updateExplanation(courseId, page, update));
    }

    @Override
    public ResponseEntity<Insights> insights(InsightsRequest request) {
        return ResponseEntity.ok(service.insights(request == null ? null : request.courseId()));
    }

    @Override
    public ResponseEntity<MistakeExplanationWrapper> explainMistake(MistakeRequest request) {
        return ResponseEntity.ok(service.explainMistake(request));
    }

    @Override
    public ResponseEntity<List<Aid>> aids(String courseId, String kind) {
        return ResponseEntity.ok(service.aids(courseId, kind));
    }

    @Override
    public ResponseEntity<List<Aid>> generateAids(AidGenerateRequest request) {
        return ResponseEntity.ok(service.generateAids(request));
    }

    @Override
    public ResponseEntity<Aid> createAid(AidCreate request) {
        return ResponseEntity.ok(service.createAid(request));
    }

    @Override
    public ResponseEntity<Aid> updateAid(String id, AidUpdate update) {
        return ResponseEntity.ok(service.updateAid(id, update));
    }

    @Override
    public ResponseEntity<Void> deleteAid(String id) {
        service.deleteAid(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<ReviewState> review(String id, ReviewRequest request) {
        return ResponseEntity.ok(service.review(id, request.remembered()));
    }
}
