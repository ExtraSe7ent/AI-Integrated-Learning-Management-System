package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IReferenceItemDao;
import vn.edu.vju.lms.entity.ReferenceItem;

@Repository
public class ReferenceItemDaoImpl extends HibernateGenericDao<String, ReferenceItem> implements IReferenceItemDao {

    public ReferenceItemDaoImpl() {
        super(ReferenceItem.class);
    }
}
