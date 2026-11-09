package vn.edu.vju.lms.service;

import java.util.List;
import java.util.Map;
import vn.edu.vju.lms.ai.EssayGrader;
import vn.edu.vju.lms.wrapper.AssessmentWrapper;

public interface AssessmentService {

    /** A student gets their own records; staff get the latest submission per assignment. */
    Map<String, AssessmentWrapper> visibleToCurrentUser();

    /** Starts, autosaves or submits for a student; grades for a lecturer. Scores are always computed here. */
    AssessmentWrapper save(String assignmentId, AssessmentWrapper wrapper);

    /** Every submission of one assignment, for the lecturer's grading list. */
    List<AssessmentWrapper> submissions(String assignmentId);

    /** Suggested essay points for one submission; nothing is saved until the lecturer publishes. */
    List<EssayGrader.Draft> essayDrafts(String assignmentId, String studentId);

    /** Applies an accepted appeal: changes one question's points and recomputes the total. */
    void regrade(String studentId, String assignmentId, int questionIndex, double points);
}
