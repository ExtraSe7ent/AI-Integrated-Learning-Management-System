package vn.edu.vju.lms.dao;

import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.CardReview;

public interface ICardReviewDao extends IGenericDao<String, CardReview> {

    List<CardReview> findByStudent(String studentId);

    void deleteByAid(String aidId);
}
