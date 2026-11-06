package vn.edu.vju.lms.common.search;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Parses "name~java,term:I,year!2025" into SearchCriteria and ANDs them into one Specification. */
public class SpecificationsBuilder<T> {

    private static final Pattern CRITERION = Pattern.compile("(\\w+)([:!<>~])([^,]+)");

    private final List<SearchCriteria> criteria = new ArrayList<>();

    public SpecificationsBuilder<T> with(String key, SearchOperation operation, String value) {
        criteria.add(new SearchCriteria(key, operation, value));
        return this;
    }

    public SpecificationsBuilder<T> parse(String search) {
        if (StringUtils.hasText(search)) {
            Matcher matcher = CRITERION.matcher(search);
            while (matcher.find()) {
                with(matcher.group(1), SearchOperation.fromSymbol(matcher.group(2).charAt(0)), matcher.group(3).trim());
            }
        }
        return this;
    }

    public Specification<T> build() {
        Specification<T> result = Specification.where(null);
        for (SearchCriteria item : criteria) {
            result = result.and(new EntitySpecification<>(item));
        }
        return result;
    }
}
