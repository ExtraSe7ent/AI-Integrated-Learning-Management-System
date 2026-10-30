package vn.edu.vju.lms.service.impl;

import org.springframework.stereotype.Service;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.service.AbstractCrudService;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.service.QuestionService;
import vn.edu.vju.lms.wrapper.QuestionWrapper;

@Service
public class QuestionServiceImpl extends AbstractCrudService<Question, QuestionWrapper> implements QuestionService {

    private final IQuestionDao dao;

    public QuestionServiceImpl(IQuestionDao dao) {
        this.dao = dao;
    }

    @Override
    protected IGenericDao<String, Question> dao() {
        return dao;
    }

    @Override
    protected Question newEntity() {
        return new Question();
    }

    @Override
    protected QuestionWrapper toWrapper(Question entity) {
        QuestionWrapper wrapper = new QuestionWrapper();
        wrapper.setId(entity.getId());
        wrapper.setText(entity.getText());
        wrapper.setOptions(entity.getOptions());
        wrapper.setCorrect(entity.getCorrect());
        wrapper.setExplanation(entity.getExplanation());
        wrapper.setPage(entity.getPage());
        wrapper.setApproved(entity.getApproved());
        return wrapper;
    }

    @Override
    protected void mapWrapperToEntity(QuestionWrapper wrapper, Question entity) {
        if (wrapper.getText() != null) {
            entity.setText(wrapper.getText());
        }
        if (wrapper.getOptions() != null) {
            entity.setOptions(wrapper.getOptions());
        }
        if (wrapper.getCorrect() != null) {
            entity.setCorrect(wrapper.getCorrect());
        }
        if (wrapper.getExplanation() != null) {
            entity.setExplanation(wrapper.getExplanation());
        }
        if (wrapper.getPage() != null) {
            entity.setPage(wrapper.getPage());
        }
        if (wrapper.getApproved() != null) {
            entity.setApproved(wrapper.getApproved());
        }
    }

    @Override
    protected String wrapperId(QuestionWrapper wrapper) {
        return wrapper.getId();
    }

    @Override
    protected void assignId(Question entity, String id) {
        entity.setId(id);
    }

    @Override
    protected String notFoundMessage() {
        return "Không tìm thấy câu hỏi.";
    }

    @Override
    protected void beforeSave(Question entity) {
        if (entity.getCorrect() == null || entity.getCorrect() < 0 || entity.getCorrect() >= entity.getOptions().size()) {
            throw new BusinessRuleException("Đáp án đúng không nằm trong danh sách lựa chọn.");
        }
    }
}
