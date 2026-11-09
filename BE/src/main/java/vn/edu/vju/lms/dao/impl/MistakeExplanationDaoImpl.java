package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IMistakeExplanationDao;
import vn.edu.vju.lms.entity.MistakeExplanation;

@Repository
public class MistakeExplanationDaoImpl extends HibernateGenericDao<String, MistakeExplanation> implements IMistakeExplanationDao {

    public MistakeExplanationDaoImpl() {
        super(MistakeExplanation.class);
    }
}
