package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.entity.Assignment;

@Repository
public class AssignmentDaoImpl extends HibernateGenericDao<String, Assignment> implements IAssignmentDao {

    public AssignmentDaoImpl() {
        super(Assignment.class);
    }
}
