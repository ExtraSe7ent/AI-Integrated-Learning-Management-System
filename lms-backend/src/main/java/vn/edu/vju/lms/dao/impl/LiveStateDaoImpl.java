package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ILiveStateDao;
import vn.edu.vju.lms.entity.LiveState;

@Repository
public class LiveStateDaoImpl extends HibernateGenericDao<String, LiveState> implements ILiveStateDao {

    public LiveStateDaoImpl() {
        super(LiveState.class);
    }
}
