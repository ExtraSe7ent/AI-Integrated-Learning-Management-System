package vn.edu.vju.lms.service;

import java.util.Map;
import vn.edu.vju.lms.wrapper.AssessmentWrapper;

public interface AssessmentService {

    /** A student gets their own records; staff get the latest submission per assignment. */
    Map<String, AssessmentWrapper> visibleToCurrentUser();

    /** Starts, autosaves or submits for a student; grades for a lecturer. Scores are always computed here. */
    AssessmentWrapper save(String assignmentId, AssessmentWrapper wrapper);
}
