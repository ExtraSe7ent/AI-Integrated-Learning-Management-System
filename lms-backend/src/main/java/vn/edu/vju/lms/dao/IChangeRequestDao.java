package vn.edu.vju.lms.dao;

import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.ChangeRequest;

public interface IChangeRequestDao extends IGenericDao<String, ChangeRequest> {
    boolean hasUnansweredRequest(String itemId);
}
