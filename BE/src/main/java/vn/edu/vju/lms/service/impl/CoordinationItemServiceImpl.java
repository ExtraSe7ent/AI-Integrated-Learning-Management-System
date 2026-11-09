package vn.edu.vju.lms.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IChangeRequestDao;
import vn.edu.vju.lms.dao.ICoordinationCompletionDao;
import vn.edu.vju.lms.dao.ICoordinationItemDao;
import vn.edu.vju.lms.entity.CoordinationItem;
import vn.edu.vju.lms.service.CoordinationItemService;
import vn.edu.vju.lms.wrapper.CoordinationItemWrapper;

@Service
public class CoordinationItemServiceImpl extends AbstractCrudService<CoordinationItem, CoordinationItemWrapper> implements CoordinationItemService {

    private final ICoordinationItemDao dao;
    private final IChangeRequestDao requestDao;
    private final ICoordinationCompletionDao completionDao;

    public CoordinationItemServiceImpl(ICoordinationItemDao dao, IChangeRequestDao requestDao, ICoordinationCompletionDao completionDao) {
        this.dao = dao;
        this.requestDao = requestDao;
        this.completionDao = completionDao;
    }

    @Override
    protected IGenericDao<String, CoordinationItem> dao() {
        return dao;
    }

    @Override
    protected CoordinationItem newEntity() {
        return new CoordinationItem();
    }

    @Override
    protected CoordinationItemWrapper toWrapper(CoordinationItem entity) {
        CoordinationItemWrapper wrapper = new CoordinationItemWrapper();
        wrapper.setId(entity.getId());
        wrapper.setCourseId(entity.getCourseId());
        wrapper.setClassId(entity.getClassId());
        wrapper.setKind(entity.getKind());
        wrapper.setTitle(entity.getTitle());
        wrapper.setBody(entity.getBody());
        wrapper.setLevel(entity.getLevel());
        wrapper.setEditable(entity.getEditable());
        wrapper.setRevision(entity.getRevision());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(CoordinationItemWrapper wrapper, CoordinationItem entity) {
        if (wrapper.getCourseId() != null) {
            entity.setCourseId(wrapper.getCourseId());
        }
        if (wrapper.getClassId() != null) {
            entity.setClassId(wrapper.getClassId());
        }
        if (wrapper.getKind() != null) {
            entity.setKind(wrapper.getKind());
        }
        if (wrapper.getTitle() != null) {
            entity.setTitle(wrapper.getTitle());
        }
        if (wrapper.getBody() != null) {
            entity.setBody(wrapper.getBody());
        }
        if (wrapper.getLevel() != null) {
            entity.setLevel(wrapper.getLevel());
        }
        if (wrapper.getEditable() != null) {
            entity.setEditable(wrapper.getEditable());
        }
        if (wrapper.getRevision() != null) {
            entity.setRevision(wrapper.getRevision());
        }
    }

    @Override
    protected String wrapperId(CoordinationItemWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(CoordinationItem entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy học liệu.";
    }

    @Override
    protected void beforeCreate(CoordinationItemWrapper wrapper, CoordinationItem entity) {
        if (entity.getLevel() == null) {
            entity.setLevel(0);
        }
        if (entity.getEditable() == null) {
            entity.setEditable(true);
        }
        if (entity.getRevision() == null) {
            entity.setRevision(1);
        }
        if (!List.of("slides", "quiz", "assignment").contains(entity.getKind())) {
            throw new BusinessRuleException("Loại học liệu không hợp lệ.");
        }
    }

    @Override
    @Transactional
    public CoordinationItemWrapper update(String id, CoordinationItemWrapper wrapper) {
        CoordinationItem current = require(id);
        boolean contentChanged = (wrapper.getBody() != null && !wrapper.getBody().equals(current.getBody()))
                || (wrapper.getTitle() != null && !wrapper.getTitle().equals(current.getTitle()));
        if (contentChanged && !Boolean.TRUE.equals(current.getEditable())) {
            throw new ForbiddenOperationException("Bạn không có quyền chỉnh sửa học liệu này.");
        }
        if (wrapper.getKind() != null && !wrapper.getKind().equals(current.getKind())) {
            throw new BusinessRuleException("Không đổi loại của học liệu đã tạo.");
        }
        if (Integer.valueOf(3).equals(wrapper.getLevel()) && requestDao.hasUnansweredRequest(id)) {
            throw new BusinessRuleException("Chờ giảng viên phản hồi trước khi duyệt đạt chuẩn.");
        }
        // Any change to reviewed content takes the class out of the "completed" state.
        completionDao.findById(current.getClassId()).ifPresent(completionDao::remove);
        return super.update(id, wrapper);
    }
}
