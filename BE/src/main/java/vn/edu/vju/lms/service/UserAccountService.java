package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.common.service.CrudService;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

public interface UserAccountService extends CrudService<UserAccountWrapper> {

    /** All-or-nothing: one invalid row rejects the whole import. */
    List<UserAccountWrapper> importAccounts(List<UserAccountWrapper> rows);

    UserAccountWrapper resetPassword(String id);
}
