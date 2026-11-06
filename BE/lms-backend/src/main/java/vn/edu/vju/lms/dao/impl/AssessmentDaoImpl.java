package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.entity.Assessment;

@Repository
public class AssessmentDaoImpl extends HibernateGenericDao<String, Assessment> implements IAssessmentDao {

    public AssessmentDaoImpl() {
        super(Assessment.class);
    }

    @Override
    public Optional<Assessment> find(String studentId, String assignmentId) {
        return single("SELECT a FROM Assessment a WHERE a.studentId = :studentId AND a.assignmentId = :assignmentId",
                Map.of("studentId", studentId, "assignmentId", assignmentId));
    }

    @Override
    public List<Assessment> findByStudent(String studentId) {
        return list("SELECT a FROM Assessment a WHERE a.studentId = :studentId", Map.of("studentId", studentId));
    }

    @Override
    public List<Assessment> findSubmitted() {
        return list("SELECT a FROM Assessment a WHERE a.score IS NOT NULL ORDER BY a.studentId", Map.of());
    }
}
