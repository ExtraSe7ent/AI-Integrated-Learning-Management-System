package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ICoordinationCompletionDao;
import vn.edu.vju.lms.entity.CoordinationCompletion;

@Repository
public class CoordinationCompletionDaoImpl extends HibernateGenericDao<String, CoordinationCompletion>
        implements ICoordinationCompletionDao {

    public CoordinationCompletionDaoImpl() {
        super(CoordinationCompletion.class);
    }
}
