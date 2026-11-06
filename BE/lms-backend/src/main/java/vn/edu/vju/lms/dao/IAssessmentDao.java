package vn.edu.vju.lms.dao;

import java.util.List;
import java.util.Optional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.Assessment;

public interface IAssessmentDao extends IGenericDao<String, Assessment> {

    Optional<Assessment> find(String studentId, String assignmentId);

    List<Assessment> findByStudent(String studentId);

    List<Assessment> findSubmitted();
}
