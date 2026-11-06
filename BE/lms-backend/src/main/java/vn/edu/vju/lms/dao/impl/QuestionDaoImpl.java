package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.entity.Question;

@Repository
public class QuestionDaoImpl extends HibernateGenericDao<String, Question> implements IQuestionDao {

    public QuestionDaoImpl() {
        super(Question.class);
    }
}
