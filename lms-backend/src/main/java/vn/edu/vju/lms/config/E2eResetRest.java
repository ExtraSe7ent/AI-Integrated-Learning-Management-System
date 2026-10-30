package vn.edu.vju.lms.config;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/** Gives each Playwright test a clean database. Exists only with the e2e profile, never in dev or prod. */
@RestController
@Profile("e2e")
public class E2eResetRest {

    private final DataSeeder seeder;

    public E2eResetRest(DataSeeder seeder) {
        this.seeder = seeder;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/e2e/reset")
    public ResponseEntity<Void> reset() throws java.io.IOException {
        seeder.reset();
        return ResponseEntity.noContent().build();
    }
}
