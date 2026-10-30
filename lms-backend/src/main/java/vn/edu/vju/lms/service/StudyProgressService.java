package vn.edu.vju.lms.service;

import java.util.Map;
import vn.edu.vju.lms.wrapper.StudyProgressWrapper;

public interface StudyProgressService {

    /** A student gets their own progress; staff get the most advanced record per session. */
    Map<String, StudyProgressWrapper> visibleToCurrentUser();

    StudyProgressWrapper save(String sessionId, StudyProgressWrapper wrapper);
}
