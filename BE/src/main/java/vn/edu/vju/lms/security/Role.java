package vn.edu.vju.lms.security;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

/** The API speaks the frontend's role codes; Spring Security sees the ROLE_* authority. */
public enum Role {
    STUDENT("sinh-vien"),
    LECTURER("giang-vien"),
    DEAN("truong-khoa"),
    COURSE_LEADER("truong-nhom-hp"),
    ADMIN("admin");

    private final String code;

    Role(String code) {
        this.code = code;
    }

    @JsonValue
    public String code() {
        return code;
    }

    public String authority() {
        return "ROLE_" + name();
    }

    public boolean teaches() {
        return this != STUDENT;
    }

    @JsonCreator
    public static Role fromCode(String code) {
        return Arrays.stream(values())
                .filter(role -> role.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Vai trò không hợp lệ: " + code));
    }
}
