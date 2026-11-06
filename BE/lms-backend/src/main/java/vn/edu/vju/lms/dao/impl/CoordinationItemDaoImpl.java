package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ICoordinationItemDao;
import vn.edu.vju.lms.entity.CoordinationItem;

@Repository
public class CoordinationItemDaoImpl extends HibernateGenericDao<String, CoordinationItem> implements ICoordinationItemDao {

    public CoordinationItemDaoImpl() {
        super(CoordinationItem.class);
    }
}
