package vn.edu.vju.lms.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;
import vn.edu.vju.lms.common.search.SearchOperation;
import vn.edu.vju.lms.common.web.PageRequests;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.security.JwtService;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.service.AssessmentGrader;
import vn.edu.vju.lms.service.TextNormalizer;

class CommonUnitsTest {

    @Test
    void searchSymbolsMapToOperations() {
        assertThat(SearchOperation.fromSymbol(':')).isEqualTo(SearchOperation.EQUALITY);
        assertThat(SearchOperation.fromSymbol('!')).isEqualTo(SearchOperation.NEGATION);
        assertThat(SearchOperation.fromSymbol('>')).isEqualTo(SearchOperation.GREATER_THAN);
        assertThat(SearchOperation.fromSymbol('<')).isEqualTo(SearchOperation.LESS_THAN);
        assertThat(SearchOperation.fromSymbol('~')).isEqualTo(SearchOperation.LIKE);
        assertThatThrownBy(() -> SearchOperation.fromSymbol('?')).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void pageRequestsClampAndParseSort() {
        var pageable = PageRequests.of(-1, 9999, "name,desc;year");
        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(200);
        assertThat(pageable.getSort().getOrderFor("name").getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(pageable.getSort().getOrderFor("year").getDirection()).isEqualTo(Sort.Direction.ASC);
        assertThat(PageRequests.of(0, 10, null).getSort().isSorted()).isFalse();
    }

    @Test
    void rolesMapBothWays() {
        assertThat(Role.fromCode("truong-nhom-hp")).isEqualTo(Role.COURSE_LEADER);
        assertThat(Role.STUDENT.authority()).isEqualTo("ROLE_STUDENT");
        assertThat(Role.STUDENT.teaches()).isFalse();
        assertThat(Role.DEAN.teaches()).isTrue();
        assertThatThrownBy(() -> Role.fromCode("x")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void textNormalizerFoldsVietnamese() {
        assertThat(TextNormalizer.fold("Đường ĐI")).isEqualTo("duong di");
        assertThat(TextNormalizer.forComparison("  P.O,  st!! ")).isEqualTo("p o st");
        assertThat(TextNormalizer.forComparison(null)).isEmpty();
        assertThat(TextNormalizer.tokens("Tài nguyên a")).containsExactly("tai", "nguyen");
    }

    @Test
    void graderMatchesTheFrontendTemplate() {
        assertThat(AssessmentGrader.grade(List.of("0", "POST", "x"))).containsExactly(4.0, 3.0, 0.0);
        assertThat(AssessmentGrader.grade(List.of())).containsExactly(0.0, 0.0, 0.0);
        assertThat(AssessmentGrader.total(List.of(4.0, 3.0, 2.25))).isEqualTo(9.3);
    }

    @Test
    void jwtRequiresALongSecretAndRejectsForeignTokens() {
        LmsProperties properties = new LmsProperties();
        properties.getSecurity().setJwtSecret("short");
        assertThatThrownBy(() -> new JwtService(properties)).isInstanceOf(IllegalStateException.class);

        properties.getSecurity().setJwtSecret("a".repeat(40));
        JwtService first = new JwtService(properties);
        assertThat(first.subject(first.issue("u1"))).contains("u1");

        properties.getSecurity().setJwtSecret("b".repeat(40));
        assertThat(new JwtService(properties).subject(first.issue("u1"))).isEmpty();

        properties.getSecurity().setJwtTtlMinutes(-1);
        JwtService expired = new JwtService(properties);
        assertThat(expired.subject(expired.issue("u1"))).isEmpty();
    }
}
