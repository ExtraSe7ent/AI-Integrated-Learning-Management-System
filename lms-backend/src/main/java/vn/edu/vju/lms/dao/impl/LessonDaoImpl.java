package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ILessonDao;
import vn.edu.vju.lms.entity.Lesson;

@Repository
public class LessonDaoImpl extends HibernateGenericDao<String, Lesson> implements ILessonDao {

    public LessonDaoImpl() {
        super(Lesson.class);
    }
}
