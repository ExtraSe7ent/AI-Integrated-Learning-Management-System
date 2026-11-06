package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Aid;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidCreate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidGenerateRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplainRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Explanation;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplanationUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Insights;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeExplanationWrapper;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ReviewState;

/** Flipped-classroom AI tools. Everything the model writes for students stays a draft until a lecturer publishes it. */
public interface StudyAiService {

    /** Students see published explanations of their own courses only. */
    List<Explanation> explanations(String courseId);

    List<Explanation> generateExplanations(String courseId, ExplainRequest request);

    /** Creates the page's explanation when there is none, so a lecturer can also write one by hand. */
    Explanation updateExplanation(String courseId, int page, ExplanationUpdate update);

    Insights insights(String courseId);

    MistakeExplanationWrapper explainMistake(MistakeRequest request);

    List<Aid> aids(String courseId, String kind);

    List<Aid> generateAids(AidGenerateRequest request);

    Aid createAid(AidCreate request);

    Aid updateAid(String id, AidUpdate update);

    void deleteAid(String id);

    ReviewState review(String aidId, boolean remembered);
}
