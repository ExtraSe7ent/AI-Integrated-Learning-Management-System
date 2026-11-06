package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IStudySessionDao;
import vn.edu.vju.lms.entity.StudySession;

@Repository
public class StudySessionDaoImpl extends HibernateGenericDao<String, StudySession> implements IStudySessionDao {

    public StudySessionDaoImpl() {
        super(StudySession.class);
    }
}
