package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ILessonExplanationDao;
import vn.edu.vju.lms.entity.LessonExplanation;

@Repository
public class LessonExplanationDaoImpl extends HibernateGenericDao<String, LessonExplanation> implements ILessonExplanationDao {

    public LessonExplanationDaoImpl() {
        super(LessonExplanation.class);
    }

    @Override
    public List<LessonExplanation> findByCourse(String courseId) {
        return list("SELECT e FROM LessonExplanation e WHERE e.courseId = :courseId ORDER BY e.page", Map.of("courseId", courseId));
    }
}
