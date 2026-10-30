package vn.edu.vju.lms.common.dao;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface IGenericDao<K, T> {

    Optional<T> findById(K id);

    List<T> findAll();

    Page<T> findAll(Specification<T> specification, Pageable pageable);

    T persist(T entity);

    T merge(T entity);

    void remove(T entity);

    long count();
}
