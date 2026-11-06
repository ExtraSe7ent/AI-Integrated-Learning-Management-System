package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IStudyProgressDao;
import vn.edu.vju.lms.entity.StudyProgress;

@Repository
public class StudyProgressDaoImpl extends HibernateGenericDao<String, StudyProgress> implements IStudyProgressDao {

    public StudyProgressDaoImpl() {
        super(StudyProgress.class);
    }

    @Override
    public List<StudyProgress> findByStudent(String studentId) {
        return list("SELECT p FROM StudyProgress p WHERE p.studentId = :studentId", Map.of("studentId", studentId));
    }
}
