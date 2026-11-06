package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ILearningAidDao;
import vn.edu.vju.lms.entity.LearningAid;

@Repository
public class LearningAidDaoImpl extends HibernateGenericDao<String, LearningAid> implements ILearningAidDao {

    public LearningAidDaoImpl() {
        super(LearningAid.class);
    }

    @Override
    public List<LearningAid> findByCourse(String courseId) {
        return list("SELECT a FROM LearningAid a WHERE a.courseId = :courseId ORDER BY a.createdAt, a.id", Map.of("courseId", courseId));
    }
}
