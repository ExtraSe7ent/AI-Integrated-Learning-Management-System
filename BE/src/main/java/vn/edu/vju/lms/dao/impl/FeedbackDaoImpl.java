package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IFeedbackDao;
import vn.edu.vju.lms.entity.Feedback;

@Repository
public class FeedbackDaoImpl extends HibernateGenericDao<String, Feedback> implements IFeedbackDao {

    public FeedbackDaoImpl() {
        super(Feedback.class);
    }
}
