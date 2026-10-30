package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IKnowledgeGapDao;
import vn.edu.vju.lms.entity.KnowledgeGap;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.KnowledgeGapService;
import vn.edu.vju.lms.wrapper.KnowledgeGapWrapper;

@Service
public class KnowledgeGapServiceImpl extends AbstractCrudService<KnowledgeGap, KnowledgeGapWrapper> implements KnowledgeGapService {

    private final IKnowledgeGapDao dao;

    public KnowledgeGapServiceImpl(IKnowledgeGapDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, KnowledgeGap> dao() {
        return dao;
    }

    @Override
    protected KnowledgeGap newEntity() {
        return new KnowledgeGap();
    }

    @Override
    protected KnowledgeGapWrapper toWrapper(KnowledgeGap entity) {
        KnowledgeGapWrapper wrapper = new KnowledgeGapWrapper();
        wrapper.setId(entity.getId());
        wrapper.setOwnerId(entity.getOwnerId());
        wrapper.setPage(entity.getPage());
        wrapper.setBody(entity.getBody());
        wrapper.setResponse(entity.getResponse());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(KnowledgeGapWrapper wrapper, KnowledgeGap entity) {
        if (wrapper.getPage() != null) {
            entity.setPage(wrapper.getPage());
        }
        if (wrapper.getBody() != null) {
            entity.setBody(wrapper.getBody());
        }
        if (wrapper.getResponse() != null) {
            entity.setResponse(wrapper.getResponse());
        }
    }

    @Override
    protected String wrapperId(KnowledgeGapWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(KnowledgeGap entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy kiến thức mờ.";
    }

    @Override
    protected void beforeCreate(KnowledgeGapWrapper wrapper, KnowledgeGap entity) {
        entity.setOwnerId(UserPrincipal.current().id());
    }

    @Override
    @Transactional
    public KnowledgeGapWrapper update(String id, KnowledgeGapWrapper wrapper) {
        requireOwnerOrStaff(require(id));
        if (UserPrincipal.current().isStudent()) {
            wrapper.setResponse(null);
        }
        return super.update(id, wrapper);
    }

    @Override
    @Transactional
    public void delete(String id) {
        requireOwnerOrStaff(require(id));
        super.delete(id);
    }

    private void requireOwnerOrStaff(KnowledgeGap entity) {
        UserPrincipal user = UserPrincipal.current();
        if (user.isStudent() && !user.id().equals(entity.getOwnerId())) {
            throw new ForbiddenOperationException("Bạn chỉ được thao tác trên dữ liệu của mình.");
        }
    }
}
