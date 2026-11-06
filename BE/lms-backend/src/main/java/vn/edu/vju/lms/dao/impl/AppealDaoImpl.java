package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IAppealDao;
import vn.edu.vju.lms.entity.Appeal;

@Repository
public class AppealDaoImpl extends HibernateGenericDao<String, Appeal> implements IAppealDao {

    public AppealDaoImpl() {
        super(Appeal.class);
    }
}
