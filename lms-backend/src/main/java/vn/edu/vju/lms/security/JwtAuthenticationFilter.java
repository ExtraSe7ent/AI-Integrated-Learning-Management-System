package vn.edu.vju.lms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.UserAccount;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;
    private final IUserAccountDao userDao;

    public JwtAuthenticationFilter(JwtService jwtService, IUserAccountDao userDao) {
        this.jwtService = jwtService;
        this.userDao = userDao;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER)) {
            var user = jwtService.subject(header.substring(BEARER.length())).flatMap(userDao::findById)
                    .filter(UserAccount::isActive);
            if (user.isPresent()) {
                UserPrincipal principal = new UserPrincipal(user.get().getId(), user.get().getRole(), user.get().isMustChange());
                // A forced password change is enforced here, not only by the frontend route guard.
                if (principal.mustChange() && !request.getRequestURI().startsWith("/api/auth/")) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Cần đổi mật khẩu trước khi tiếp tục.");
                    return;
                }
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(principal, null, principal.authorities()));
            }
        }
        chain.doFilter(request, response);
    }
}
