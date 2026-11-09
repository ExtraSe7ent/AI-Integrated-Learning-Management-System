package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ILiveResultDao;
import vn.edu.vju.lms.entity.LiveResult;

@Repository
public class LiveResultDaoImpl extends HibernateGenericDao<String, LiveResult> implements ILiveResultDao {

    public LiveResultDaoImpl() {
        super(LiveResult.class);
    }
}
