package vn.edu.vju.lms.common.search;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

/** One SearchCriteria as a JPA predicate, built with the Criteria API. */
public class EntitySpecification<T> implements Specification<T> {

    private static final long serialVersionUID = 1L;

    private final SearchCriteria criteria;

    public EntitySpecification(SearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder builder) {
        Path<Object> path;
        try {
            path = root.get(criteria.key());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Không tìm kiếm được theo trường: " + criteria.key());
        }
        Object value = convert(path.getJavaType(), criteria.value());
        return switch (criteria.operation()) {
            case EQUALITY -> builder.equal(path, value);
            case NEGATION -> builder.notEqual(path, value);
            case GREATER_THAN -> builder.greaterThan(path.as(String.class), criteria.value());
            case LESS_THAN -> builder.lessThan(path.as(String.class), criteria.value());
            case LIKE -> builder.like(builder.lower(path.as(String.class)),
                    "%" + criteria.value().toLowerCase() + "%");
        };
    }

    private Object convert(Class<?> type, String value) {
        if (type == Boolean.class || type == boolean.class) {
            return Boolean.valueOf(value);
        }
        if (type == Integer.class || type == int.class) {
            return Integer.valueOf(value);
        }
        if (type == Long.class || type == long.class) {
            return Long.valueOf(value);
        }
        return value;
    }
}
