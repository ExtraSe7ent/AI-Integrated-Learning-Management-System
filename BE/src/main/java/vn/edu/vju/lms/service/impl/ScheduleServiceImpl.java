package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IScheduleDao;
import vn.edu.vju.lms.entity.Schedule;
import vn.edu.vju.lms.service.ScheduleService;
import vn.edu.vju.lms.wrapper.ScheduleWrapper;

@Service
public class ScheduleServiceImpl extends AbstractCrudService<Schedule, ScheduleWrapper> implements ScheduleService {

    private final IScheduleDao dao;

    public ScheduleServiceImpl(IScheduleDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Schedule> dao() {
        return dao;
    }

    @Override
    protected Schedule newEntity() {
        return new Schedule();
    }

    @Override
    protected ScheduleWrapper toWrapper(Schedule entity) {
        ScheduleWrapper wrapper = new ScheduleWrapper();
        wrapper.setId(entity.getId());
        wrapper.setClassId(entity.getClassId());
        wrapper.setDayOfWeek(entity.getDayOfWeek());
        wrapper.setStartTime(entity.getStartTime());
        wrapper.setEndTime(entity.getEndTime());
        wrapper.setRoom(entity.getRoom());
        wrapper.setPeriodCount(entity.getPeriodCount());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ScheduleWrapper wrapper, Schedule entity) {
        if (wrapper.getClassId() != null) {
            entity.setClassId(wrapper.getClassId());
        }
        if (wrapper.getDayOfWeek() != null) {
            entity.setDayOfWeek(wrapper.getDayOfWeek());
        }
        if (wrapper.getStartTime() != null) {
            entity.setStartTime(wrapper.getStartTime());
        }
        if (wrapper.getEndTime() != null) {
            entity.setEndTime(wrapper.getEndTime());
        }
        if (wrapper.getRoom() != null) {
            entity.setRoom(wrapper.getRoom());
        }
        if (wrapper.getPeriodCount() != null) {
            entity.setPeriodCount(wrapper.getPeriodCount());
        }
    }

    @Override
    protected String wrapperId(ScheduleWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Schedule entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy lịch học.";
    }

    @Override
    protected void beforeSave(Schedule entity) {
        if (entity.getEndTime().compareTo(entity.getStartTime()) <= 0) {
            throw new BusinessRuleException("Giờ kết thúc phải sau giờ bắt đầu.");
        }
    }
}
