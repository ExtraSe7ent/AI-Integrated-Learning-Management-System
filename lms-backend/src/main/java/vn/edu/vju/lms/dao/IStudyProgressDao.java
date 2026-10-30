package vn.edu.vju.lms.dao;

import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.StudyProgress;

public interface IStudyProgressDao extends IGenericDao<String, StudyProgress> {

    List<StudyProgress> findByStudent(String studentId);
}
