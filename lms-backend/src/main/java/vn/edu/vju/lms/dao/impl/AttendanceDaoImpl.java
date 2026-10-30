package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IAttendanceDao;
import vn.edu.vju.lms.entity.Attendance;

@Repository
public class AttendanceDaoImpl extends HibernateGenericDao<String, Attendance> implements IAttendanceDao {

    public AttendanceDaoImpl() {
        super(Attendance.class);
    }
}
