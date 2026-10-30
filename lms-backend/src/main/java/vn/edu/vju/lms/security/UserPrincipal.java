package vn.edu.vju.lms.security;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;

/** Authenticated caller; read from the database on every request so a deactivation applies at once. */
public record UserPrincipal(String id, Role role, boolean mustChange) {

    public Collection<? extends GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority(role.authority()));
    }

    public boolean isStudent() {
        return role == Role.STUDENT;
    }

    public static UserPrincipal current() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new ForbiddenOperationException("Cần đăng nhập để thực hiện thao tác này.");
    }
}
