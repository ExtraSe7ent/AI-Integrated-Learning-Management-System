package vn.edu.vju.lms.wrapper;

import lombok.Data;
import vn.edu.vju.lms.security.Role;

/** Never carries the password hash; the empty passwordHash only satisfies the frontend's ManagedUser type. */
@Data
public class UserAccountWrapper {

    private String id;

    private String name;

    private String email;

    private String phone;

    private String faculty;

    private String major;

    private String kind;

    private Role role;

    private Boolean active;

    private Boolean mustChange;

    private final String passwordHash = "";
}
