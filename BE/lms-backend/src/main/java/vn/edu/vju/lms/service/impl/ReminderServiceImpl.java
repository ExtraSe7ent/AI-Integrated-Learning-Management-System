package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IReminderDao;
import vn.edu.vju.lms.entity.Reminder;
import vn.edu.vju.lms.service.ReminderService;
import vn.edu.vju.lms.wrapper.ReminderWrapper;

@Service
public class ReminderServiceImpl extends AbstractCrudService<Reminder, ReminderWrapper> implements ReminderService {

    private final IReminderDao dao;

    public ReminderServiceImpl(IReminderDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Reminder> dao() {
        return dao;
    }

    @Override
    protected Reminder newEntity() {
        return new Reminder();
    }

    @Override
    protected ReminderWrapper toWrapper(Reminder entity) {
        ReminderWrapper wrapper = new ReminderWrapper();
        wrapper.setId(entity.getId());
        wrapper.setKey(entity.getKey());
        wrapper.setCreatedAt(entity.getCreatedAt());
        wrapper.setCandidate(entity.getCandidate());
        wrapper.setChannel(entity.getChannel());
        wrapper.setStatus(entity.getStatus());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(ReminderWrapper wrapper, Reminder entity) {
        if (wrapper.getKey() != null) {
            entity.setKey(wrapper.getKey());
        }
        if (wrapper.getCreatedAt() != null) {
            entity.setCreatedAt(wrapper.getCreatedAt());
        }
        if (wrapper.getCandidate() != null) {
            entity.setCandidate(wrapper.getCandidate());
        }
        if (wrapper.getChannel() != null) {
            entity.setChannel(wrapper.getChannel());
        }
        if (wrapper.getStatus() != null) {
            entity.setStatus(wrapper.getStatus());
        }
    }

    @Override
    protected String wrapperId(ReminderWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Reminder entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy nhắc hạn.";
    }
}
