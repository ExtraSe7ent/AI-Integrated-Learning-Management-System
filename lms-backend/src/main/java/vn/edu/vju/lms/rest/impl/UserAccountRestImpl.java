package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.common.web.PageResponse;
import vn.edu.vju.lms.rest.UserAccountRest;
import vn.edu.vju.lms.service.UserAccountService;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

@RestController
public class UserAccountRestImpl implements UserAccountRest {

    private final UserAccountService service;

    public UserAccountRestImpl(UserAccountService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<PageResponse<UserAccountWrapper>> search(String search, int page, int size, String sort) {
        return ResponseEntity.ok(service.search(search, page, size, sort));
    }

    @Override
    public ResponseEntity<UserAccountWrapper> get(String id) {
        return ResponseEntity.ok(service.get(id));
    }

    @Override
    public ResponseEntity<List<UserAccountWrapper>> importAccounts(List<UserAccountWrapper> rows) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.importAccounts(rows));
    }

    @Override
    public ResponseEntity<UserAccountWrapper> update(String id, UserAccountWrapper wrapper) {
        return ResponseEntity.ok(service.update(id, wrapper));
    }

    @Override
    public ResponseEntity<UserAccountWrapper> resetPassword(String id) {
        return ResponseEntity.ok(service.resetPassword(id));
    }
}
