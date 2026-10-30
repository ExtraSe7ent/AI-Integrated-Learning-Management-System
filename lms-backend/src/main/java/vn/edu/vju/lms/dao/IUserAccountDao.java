package vn.edu.vju.lms.dao;

import java.util.Optional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.UserAccount;

public interface IUserAccountDao extends IGenericDao<String, UserAccount> {

    Optional<UserAccount> findByIdIgnoreCase(String id);

    boolean existsByEmailHash(String emailHash);
}
