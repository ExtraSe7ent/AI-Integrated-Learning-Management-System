package vn.edu.vju.lms.common.dao;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.query.QueryUtils;

/** EntityManager-based DAO shared by every entity; subclasses add their own JPQL queries. */
public abstract class HibernateGenericDao<K, T> implements IGenericDao<K, T> {

    @PersistenceContext
    protected EntityManager entityManager;

    private final Class<T> type;

    protected HibernateGenericDao(Class<T> type) {
        this.type = type;
    }

    @Override
    public Optional<T> findById(K id) {
        return Optional.ofNullable(entityManager.find(type, id));
    }

    @Override
    public List<T> findAll() {
        return entityManager.createQuery("SELECT e FROM " + type.getSimpleName() + " e", type).getResultList();
    }

    @Override
    public Page<T> findAll(Specification<T> specification, Pageable pageable) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<T> query = builder.createQuery(type);
        Root<T> root = query.from(type);
        Predicate predicate = specification.toPredicate(root, query, builder);
        if (predicate != null) {
            query.where(predicate);
        }
        query.orderBy(QueryUtils.toOrders(pageable.getSort(), root, builder));
        TypedQuery<T> typed = entityManager.createQuery(query);
        if (pageable.isPaged()) {
            typed.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize());
        }
        return new PageImpl<>(typed.getResultList(), pageable, count(specification));
    }

    private long count(Specification<T> specification) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = builder.createQuery(Long.class);
        Root<T> root = query.from(type);
        Predicate predicate = specification.toPredicate(root, query, builder);
        if (predicate != null) {
            query.where(predicate);
        }
        return entityManager.createQuery(query.select(builder.count(root))).getSingleResult();
    }

    @Override
    public T persist(T entity) {
        entityManager.persist(entity);
        return entity;
    }

    @Override
    public T merge(T entity) {
        return entityManager.merge(entity);
    }

    @Override
    public void remove(T entity) {
        entityManager.remove(entityManager.contains(entity) ? entity : entityManager.merge(entity));
    }

    @Override
    public long count() {
        return entityManager.createQuery("SELECT COUNT(e) FROM " + type.getSimpleName() + " e", Long.class)
                .getSingleResult();
    }

    protected List<T> list(String jpql, Map<String, ?> parameters) {
        TypedQuery<T> query = entityManager.createQuery(jpql, type);
        parameters.forEach(query::setParameter);
        return query.getResultList();
    }

    protected Optional<T> single(String jpql, Map<String, ?> parameters) {
        TypedQuery<T> query = entityManager.createQuery(jpql, type).setMaxResults(1);
        parameters.forEach(query::setParameter);
        try {
            return Optional.of(query.getSingleResult());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }
}
