package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IFeedbackImageDao;
import vn.edu.vju.lms.entity.FeedbackImage;

@Repository
public class FeedbackImageDaoImpl extends HibernateGenericDao<String, FeedbackImage> implements IFeedbackImageDao {

    public FeedbackImageDaoImpl() {
        super(FeedbackImage.class);
    }
}
