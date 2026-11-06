package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.INoticeDao;
import vn.edu.vju.lms.entity.Notice;

@Repository
public class NoticeDaoImpl extends HibernateGenericDao<String, Notice> implements INoticeDao {

    public NoticeDaoImpl() {
        super(Notice.class);
    }
}
