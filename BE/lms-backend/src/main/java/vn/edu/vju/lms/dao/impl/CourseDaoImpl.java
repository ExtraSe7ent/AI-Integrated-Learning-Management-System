package vn.edu.vju.lms.dao.impl;

import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.entity.Course;

@Repository
public class CourseDaoImpl extends HibernateGenericDao<String, Course> implements ICourseDao {

    public CourseDaoImpl() {
        super(Course.class);
    }

    @Override
    public boolean existsOtherWithCode(String id, String code) {
        return single("SELECT c FROM Course c WHERE LOWER(c.code) = LOWER(:code) AND c.id <> :id",
                Map.of("code", code, "id", id)).isPresent();
    }
}
