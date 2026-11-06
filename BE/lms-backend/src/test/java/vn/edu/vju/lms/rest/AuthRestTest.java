package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.wrapper.UserAccountWrapper;

class AuthRestTest extends AbstractApiTest {

    private static final String LOGIN = "/api/auth/login";

    private String login(String user, String password) throws Exception {
        return json(Map.of("username", user, "password", password));
    }

    private UserAccount createUser(String id, boolean mustChange) {
        UserAccount user = new UserAccount();
        user.setId(id);
        user.setName(id);
        user.setEmail(id + "@example.edu");
        user.setEmailHash(aesService.blindIndex(user.getEmail()));
        user.setKind("student");
        user.setRole(Role.STUDENT);
        user.setMustChange(mustChange);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        tx.executeWithoutResult(s -> userDao.persist(user));
        return user;
    }

    @Test
    void loginIsCaseInsensitiveAndReturnsAccountWithoutHash() throws Exception {
        mvc.perform(post(LOGIN).contentType(JSON).content(login("gv001", PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.account.id").value(LECTURER))
                .andExpect(jsonPath("$.account.role").value("giang-vien"))
                .andExpect(jsonPath("$.account.passwordHash").value(""));
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameAnswer() throws Exception {
        mvc.perform(post(LOGIN).contentType(JSON).content(login(LECTURER, "wrong-password")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post(LOGIN).contentType(JSON).content(login("nobody", PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deactivatedAccountCannotLoginAndItsTokenStopsWorking() throws Exception {
        createUser("inactive1", false);
        var headers = auth("inactive1");
        mvc.perform(get("/api/auth/me").headers(headers)).andExpect(status().isOk());
        tx.executeWithoutResult(s -> userDao.findById("inactive1").orElseThrow().setActive(false));
        mvc.perform(get("/api/auth/me").headers(headers)).andExpect(status().isUnauthorized());
        mvc.perform(post(LOGIN).contentType(JSON).content(login("inactive1", PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidTokenIsRejected() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void mustChangeBlocksEverythingExceptAuthEndpoints() throws Exception {
        createUser("forced1", true);
        var headers = auth("forced1");
        mvc.perform(get("/api/bootstrap").headers(headers)).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/change-password").headers(headers).contentType(JSON)
                .content(json(Map.of("newPassword", "new-password-1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChange").value(false));
        mvc.perform(get("/api/bootstrap").headers(headers)).andExpect(status().isOk());
    }

    @Test
    void changePasswordEnforcesRules() throws Exception {
        createUser("changer1", false);
        var headers = auth("changer1");
        mvc.perform(post("/api/auth/change-password").headers(headers).contentType(JSON)
                .content(json(Map.of("oldPassword", "bad", "newPassword", "new-password-1"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mật khẩu hiện tại không đúng."));
        mvc.perform(post("/api/auth/change-password").headers(headers).contentType(JSON)
                .content(json(Map.of("oldPassword", PASSWORD, "newPassword", "short"))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/change-password").headers(headers).contentType(JSON)
                .content(json(Map.of("oldPassword", PASSWORD, "newPassword", PASSWORD))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/change-password").headers(headers).contentType(JSON)
                .content(json(Map.of("oldPassword", PASSWORD, "newPassword", "new-password-1"))))
                .andExpect(status().isOk());
    }

    @Test
    void profileUpdateKeepsEmailUnique() throws Exception {
        createUser("profile1", false);
        var headers = auth("profile1");
        mvc.perform(put("/api/me/profile").headers(headers).contentType(JSON)
                .content(json(Map.of("name", "Tên mới", "email", "new1@example.edu", "phone", "0901", "major", "CNTT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tên mới"))
                .andExpect(jsonPath("$.email").value("new1@example.edu"));
        mvc.perform(put("/api/me/profile").headers(headers).contentType(JSON)
                .content(json(Map.of("email", "gv001@example.edu"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void emailAndPhoneAreEncryptedAtRest() throws Exception {
        createUser("cipher1", false);
        mvc.perform(put("/api/me/profile").headers(auth("cipher1")).contentType(JSON)
                .content(json(Map.of("phone", "0912345678"))))
                .andExpect(status().isOk());
        var query = "SELECT email, phone FROM user_accounts WHERE id = 'cipher1'";
        Object[] raw = tx.execute(s -> (Object[]) entityManagerQuery(query));
        assertThat((String) raw[0]).doesNotContain("@example.edu");
        assertThat((String) raw[1]).doesNotContain("0912345678");
    }

    @org.springframework.beans.factory.annotation.Autowired
    private jakarta.persistence.EntityManager entityManager;

    private Object entityManagerQuery(String sql) {
        return entityManager.createNativeQuery(sql).getSingleResult();
    }

    @Test
    void preferencesAreSaved() throws Exception {
        createUser("prefs1", false);
        mvc.perform(put("/api/me/preferences").headers(auth("prefs1")).contentType(JSON)
                .content(json(Map.of("notes", "ghi chú", "noticesRead", true))))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/bootstrap").headers(auth("prefs1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("ghi chú"))
                .andExpect(jsonPath("$.readNotices").value(true));
    }

    @Test
    void adminManagesUsers() throws Exception {
        UserAccountWrapper student = new UserAccountWrapper();
        student.setId("IMP001");
        student.setName("Nhập mới");
        student.setEmail("imp001@example.edu");
        student.setKind("student");
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(student))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].mustChange").value(true));
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(student))))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/users").param("search", "id:IMP001").headers(auth(ADMIN)))
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/users/IMP001").headers(auth(ADMIN))).andExpect(status().isOk());

        mvc.perform(post("/api/users/IMP001/reset-password").headers(auth(ADMIN))).andExpect(status().isOk());
        UserAccountWrapper promote = new UserAccountWrapper();
        promote.setRole(Role.DEAN);
        mvc.perform(put("/api/users/IMP001").headers(auth(ADMIN)).contentType(JSON).content(json(promote)))
                .andExpect(status().isBadRequest());
        promote.setRole(null);
        promote.setActive(false);
        mvc.perform(put("/api/users/IMP001").headers(auth(ADMIN)).contentType(JSON).content(json(promote)))
                .andExpect(jsonPath("$.active").value(false));
        mvc.perform(post("/api/users/" + ADMIN + "/reset-password").headers(auth(ADMIN))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/users/" + ADMIN).headers(auth(ADMIN)).contentType(JSON).content(json(promote)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void importRejectsBadRows() throws Exception {
        UserAccountWrapper bad = new UserAccountWrapper();
        bad.setId("BAD 1");
        bad.setName("x");
        bad.setEmail("x@example.edu");
        bad.setKind("student");
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(bad))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content("[]"))
                .andExpect(status().isBadRequest());
        bad.setId("GOOD1");
        bad.setKind("alien");
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(bad))))
                .andExpect(status().isBadRequest());
        bad.setKind("teacher");
        bad.setEmail(null);
        mvc.perform(post("/api/users/import").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(bad))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlyAdminCanListUsers() throws Exception {
        mvc.perform(get("/api/users").headers(auth(STUDENT))).andExpect(status().isForbidden());
    }

    @Test
    void openApiDocumentIsPublic() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
    }
}
