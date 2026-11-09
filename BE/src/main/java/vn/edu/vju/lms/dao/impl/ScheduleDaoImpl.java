package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IScheduleDao;
import vn.edu.vju.lms.entity.Schedule;

@Repository
public class ScheduleDaoImpl extends HibernateGenericDao<String, Schedule> implements IScheduleDao {

    public ScheduleDaoImpl() {
        super(Schedule.class);
    }
}
