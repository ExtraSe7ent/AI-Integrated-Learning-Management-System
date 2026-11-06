package vn.edu.vju.lms.service;

import java.util.Map;
import vn.edu.vju.lms.wrapper.StudyProgressWrapper;

public interface StudyProgressService {

    /** A student gets their own progress; staff get the most advanced record per session. */
    Map<String, StudyProgressWrapper> visibleToCurrentUser();

    /** UC-B01/B02: the server decides how far the student got and when the session was completed. */
    StudyProgressWrapper save(String sessionId, StudyProgressWrapper wrapper);

    /** UC-B03: grades one pre-class quiz answer; the first answer counts, as AF-1 records wrong answers too. */
    QuizResult answer(String sessionId, String questionId, int choice);

    record QuizResult(boolean correct, int correctIndex, String explanation, StudyProgressWrapper progress) {
    }
}
