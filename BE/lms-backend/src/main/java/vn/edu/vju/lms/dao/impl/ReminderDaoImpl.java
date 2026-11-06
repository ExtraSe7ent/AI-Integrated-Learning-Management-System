package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IReminderDao;
import vn.edu.vju.lms.entity.Reminder;

@Repository
public class ReminderDaoImpl extends HibernateGenericDao<String, Reminder> implements IReminderDao {

    public ReminderDaoImpl() {
        super(Reminder.class);
    }
}
