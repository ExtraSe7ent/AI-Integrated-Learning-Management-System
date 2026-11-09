package vn.edu.vju.lms.dao.impl;

import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.UserAccount;

@Repository
public class UserAccountDaoImpl extends HibernateGenericDao<String, UserAccount> implements IUserAccountDao {

    public UserAccountDaoImpl() {
        super(UserAccount.class);
    }

    @Override
    public Optional<UserAccount> findByIdIgnoreCase(String id) {
        return single("SELECT u FROM UserAccount u WHERE LOWER(u.id) = LOWER(:id)", Map.of("id", id));
    }

    @Override
    public boolean existsByEmailHash(String emailHash) {
        return single("SELECT u FROM UserAccount u WHERE u.emailHash = :hash", Map.of("hash", emailHash)).isPresent();
    }
}
