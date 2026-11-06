package vn.edu.vju.lms.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.StudyProgress;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.StudyProgressService;
import vn.edu.vju.lms.wrapper.StudyProgressWrapper;

@Service
public class StudyProgressServiceImpl implements StudyProgressService {

    private final IStudyProgressDao progressDao;
    private final IStudySessionDao sessionDao;

    public StudyProgressServiceImpl(IStudyProgressDao progressDao, IStudySessionDao sessionDao) {
        this.progressDao = progressDao;
        this.sessionDao = sessionDao;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, StudyProgressWrapper> visibleToCurrentUser() {
        UserPrincipal user = UserPrincipal.current();
        List<StudyProgress> records = user.isStudent() ? progressDao.findByStudent(user.id()) : progressDao.findAll();
        Map<String, StudyProgressWrapper> result = new HashMap<>();
        for (StudyProgress record : records) {
            result.merge(record.getSessionId(), toWrapper(record),
                    (kept, next) -> next.getProgress() > kept.getProgress() ? next : kept);
        }
        return result;
    }

    @Override
    @Transactional
    public StudyProgressWrapper save(String sessionId, StudyProgressWrapper wrapper) {
        sessionDao.findById(sessionId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên tự học."));
        String studentId = UserPrincipal.current().id();
        String id = studentId + ":" + sessionId;
        StudyProgress record = progressDao.findById(id).orElseGet(() -> {
            StudyProgress created = new StudyProgress();
            created.setId(id);
            created.setStudentId(studentId);
            created.setSessionId(sessionId);
            return progressDao.persist(created);
        });
        record.setProgress(wrapper.getProgress());
        record.setAnswers(wrapper.getAnswers());
        record.setCompletedAt(wrapper.getCompletedAt());
        return toWrapper(record);
    }

    private StudyProgressWrapper toWrapper(StudyProgress record) {
        StudyProgressWrapper wrapper = new StudyProgressWrapper();
        wrapper.setProgress(record.getProgress());
        wrapper.setAnswers(record.getAnswers());
        wrapper.setCompletedAt(record.getCompletedAt());
        return wrapper;
    }
}
