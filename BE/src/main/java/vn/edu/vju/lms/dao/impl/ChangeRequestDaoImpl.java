package vn.edu.vju.lms.dao.impl;

import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IChangeRequestDao;
import vn.edu.vju.lms.entity.ChangeRequest;

@Repository
public class ChangeRequestDaoImpl extends HibernateGenericDao<String, ChangeRequest> implements IChangeRequestDao {

    public ChangeRequestDaoImpl() {
        super(ChangeRequest.class);
    }

    @Override
    public boolean hasUnansweredRequest(String itemId) {
        return single("SELECT r FROM ChangeRequest r WHERE r.itemId = :itemId AND r.closed = false AND (r.reply IS NULL OR r.reply = '')",
                Map.of("itemId", itemId)).isPresent();
    }
}
