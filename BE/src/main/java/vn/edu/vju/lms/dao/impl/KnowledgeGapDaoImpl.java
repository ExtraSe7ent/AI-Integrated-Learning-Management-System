package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IKnowledgeGapDao;
import vn.edu.vju.lms.entity.KnowledgeGap;

@Repository
public class KnowledgeGapDaoImpl extends HibernateGenericDao<String, KnowledgeGap> implements IKnowledgeGapDao {

    public KnowledgeGapDaoImpl() {
        super(KnowledgeGap.class);
    }
}
