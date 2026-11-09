package vn.edu.vju.lms.dao;

import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.LearningAid;

public interface ILearningAidDao extends IGenericDao<String, LearningAid> {

    List<LearningAid> findByCourse(String courseId);
}
