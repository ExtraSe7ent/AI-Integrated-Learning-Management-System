package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IAppealDao;
import vn.edu.vju.lms.entity.Appeal;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AppealService;
import vn.edu.vju.lms.service.AssessmentService;
import vn.edu.vju.lms.wrapper.AppealWrapper;

@Service
public class AppealServiceImpl extends AbstractCrudService<Appeal, AppealWrapper> implements AppealService {

    private final IAppealDao dao;
    private final AssessmentService assessments;
    private final vn.edu.vju.lms.dao.IAssignmentDao assignmentDao;

    public AppealServiceImpl(IAppealDao dao, AssessmentService assessments, vn.edu.vju.lms.dao.IAssignmentDao assignmentDao) {
        this.dao = dao;
        this.assessments = assessments;
        this.assignmentDao = assignmentDao;
    }

    /** A student refers to questions in their own (possibly shuffled) order; appeals store the original index. */
    private int[] studentOrder(String assignmentId, String studentId) {
        return assignmentDao.findById(String.valueOf(assignmentId))
                .map(assignment -> vn.edu.vju.lms.service.ExamOrder.of(assignment, studentId)).orElse(new int[0]);
    }

    @Override
    protected IGenericDao<String, Appeal> dao() {
        return dao;
    }

    @Override
    protected Appeal newEntity() {
        return new Appeal();
    }

    @Override
    protected AppealWrapper toWrapper(Appeal entity) {
        AppealWrapper wrapper = new AppealWrapper();
        wrapper.setId(entity.getId());
        wrapper.setOwnerId(entity.getOwnerId());
        wrapper.setAssignmentId(entity.getAssignmentId());
        wrapper.setQuestion(entity.getQuestion());
        wrapper.setReason(entity.getReason());
        wrapper.setResponse(entity.getResponse());
        wrapper.setGrade(entity.getGrade());
        wrapper.setStatus(entity.getStatus());
        wrapper.setQuestionIndex(entity.getQuestionIndex() != null && UserPrincipal.callerIsStudent()
                ? (Integer) vn.edu.vju.lms.service.ExamOrder.shownIndex(entity.getQuestionIndex(),
                        studentOrder(entity.getAssignmentId(), entity.getOwnerId()))
                : entity.getQuestionIndex());
        wrapper.setAnswer(entity.getAnswer());
        wrapper.setPreviousPoints(entity.getPreviousPoints());
        wrapper.setMaxPoints(entity.getMaxPoints());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(AppealWrapper wrapper, Appeal entity) {
        if (wrapper.getAssignmentId() != null) {
            entity.setAssignmentId(wrapper.getAssignmentId());
        }
        if (wrapper.getQuestion() != null) {
            entity.setQuestion(wrapper.getQuestion());
        }
        if (wrapper.getReason() != null) {
            entity.setReason(wrapper.getReason());
        }
        if (wrapper.getResponse() != null) {
            entity.setResponse(wrapper.getResponse());
        }
        if (wrapper.getGrade() != null) {
            entity.setGrade(wrapper.getGrade());
        }
        if (wrapper.getStatus() != null) {
            entity.setStatus(wrapper.getStatus());
        }
        if (wrapper.getQuestionIndex() != null) {
            entity.setQuestionIndex(UserPrincipal.callerIsStudent()
                    ? (Integer) vn.edu.vju.lms.service.ExamOrder.originalIndex(wrapper.getQuestionIndex(),
                            studentOrder(entity.getAssignmentId(), UserPrincipal.current().id()))
                    : wrapper.getQuestionIndex());
        }
        if (wrapper.getAnswer() != null) {
            entity.setAnswer(wrapper.getAnswer());
        }
        if (wrapper.getPreviousPoints() != null) {
            entity.setPreviousPoints(wrapper.getPreviousPoints());
        }
        if (wrapper.getMaxPoints() != null) {
            entity.setMaxPoints(wrapper.getMaxPoints());
        }
    }

    @Override
    protected String wrapperId(AppealWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Appeal entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy yêu cầu phúc khảo.";
    }

    @Override
    protected void beforeCreate(AppealWrapper wrapper, Appeal entity) {
        if (entity.getStatus() == null) {
            entity.setStatus("pending");
        }
        entity.setOwnerId(UserPrincipal.current().id());
        if (UserPrincipal.current().isStudent()) {
            entity.setStatus("pending");
        }
    }

    @Override
    @Transactional
    public AppealWrapper update(String id, AppealWrapper wrapper) {
        Appeal appeal = require(id);
        requireOwnerOrStaff(appeal);
        if (UserPrincipal.current().isStudent()) {
            wrapper.setResponse(null);
            wrapper.setGrade(null);
            wrapper.setStatus(null);
        } else if ("accepted".equals(wrapper.getStatus()) && "pending".equals(appeal.getStatus())
                && wrapper.getGrade() != null && appeal.getQuestionIndex() != null) {
            assessments.regrade(appeal.getOwnerId(), appeal.getAssignmentId(), appeal.getQuestionIndex(), wrapper.getGrade());
        }
        return super.update(id, wrapper);
    }

    @Override
    @Transactional
    public void delete(String id) {
        requireOwnerOrStaff(require(id));
        super.delete(id);
    }

    private void requireOwnerOrStaff(Appeal entity) {
        UserPrincipal user = UserPrincipal.current();
        if (user.isStudent() && !user.id().equals(entity.getOwnerId())) {
            throw new ForbiddenOperationException("Bạn chỉ được thao tác trên dữ liệu của mình.");
        }
    }
}
