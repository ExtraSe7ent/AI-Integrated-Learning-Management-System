package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.crypto.EncryptedStringConverter;
import vn.edu.vju.lms.security.Role;

@Entity
@Table(name = "user_accounts")
@Getter
@Setter
public class UserAccount {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false)
    private String name;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String email;

    /** Keyed hash of the normalized email: keeps uniqueness checks possible on encrypted data. */
    @Column(name = "email_hash", unique = true, length = 64)
    private String emailHash;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(columnDefinition = "TEXT")
    private String phone;

    private String faculty;

    private String major;

    /** student, teacher or admin; a teacher account can hold a management role. */
    @Column(nullable = false, length = 20)
    private String kind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    private boolean active = true;

    @Column(name = "must_change")
    private boolean mustChange;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "notices_read")
    private boolean noticesRead;
}
