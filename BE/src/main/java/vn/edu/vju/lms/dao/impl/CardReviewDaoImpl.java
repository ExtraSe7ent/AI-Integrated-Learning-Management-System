package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.ICardReviewDao;
import vn.edu.vju.lms.entity.CardReview;

@Repository
public class CardReviewDaoImpl extends HibernateGenericDao<String, CardReview> implements ICardReviewDao {

    public CardReviewDaoImpl() {
        super(CardReview.class);
    }

    @Override
    public List<CardReview> findByStudent(String studentId) {
        return list("SELECT r FROM CardReview r WHERE r.studentId = :studentId", Map.of("studentId", studentId));
    }

    @Override
    public void deleteByAid(String aidId) {
        entityManager.createQuery("DELETE FROM CardReview r WHERE r.aidId = :aidId").setParameter("aidId", aidId).executeUpdate();
    }
}
