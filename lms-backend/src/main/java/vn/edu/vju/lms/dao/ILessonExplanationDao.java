package vn.edu.vju.lms.dao;

import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.LessonExplanation;

public interface ILessonExplanationDao extends IGenericDao<String, LessonExplanation> {

    List<LessonExplanation> findByCourse(String courseId);
}
