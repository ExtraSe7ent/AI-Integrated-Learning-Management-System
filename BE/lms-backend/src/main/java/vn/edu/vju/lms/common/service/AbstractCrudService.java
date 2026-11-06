package vn.edu.vju.lms.common.service;

import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.common.search.SpecificationsBuilder;
import vn.edu.vju.lms.common.web.PageRequests;
import vn.edu.vju.lms.common.web.PageResponse;

/** CRUD flow shared by services; each one supplies the wrapper/entity mapping and its own checks. */
public abstract class AbstractCrudService<E, W> implements CrudService<W> {

    protected final Logger log = LoggerFactory.getLogger(getClass());

    protected abstract IGenericDao<String, E> dao();

    protected abstract E newEntity();

    protected abstract W toWrapper(E entity);

    /** Copies only the non-null wrapper fields, which is what makes PUT a partial update. */
    protected abstract void mapWrapperToEntity(W wrapper, E entity);

    protected abstract String wrapperId(W wrapper);

    protected abstract void assignId(E entity, String id);

    protected abstract String notFoundMessage();

    protected void beforeCreate(W wrapper, E entity) {
    }

    protected void beforeSave(E entity) {
    }

    protected void checkDelete(E entity) {
    }

    @Override
    @Transactional(readOnly = true)
    public W get(String id) {
        return toWrapper(require(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<W> listAll() {
        return dao().findAll().stream().map(this::toWrapper).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<W> search(String search, int page, int size, String sort) {
        var specification = new SpecificationsBuilder<E>().parse(search).build();
        return PageResponse.of(dao().findAll(specification, PageRequests.of(page, size, sort)).map(this::toWrapper));
    }

    @Override
    @Transactional
    public W create(W wrapper) {
        String id = wrapperId(wrapper);
        if (StringUtils.hasText(id) && dao().findById(id).isPresent()) {
            throw new BusinessRuleException("Bản ghi đã tồn tại: " + id);
        }
        E entity = newEntity();
        assignId(entity, StringUtils.hasText(id) ? id : UUID.randomUUID().toString());
        mapWrapperToEntity(wrapper, entity);
        beforeCreate(wrapper, entity);
        beforeSave(entity);
        log.info("Creating {} {}", entity.getClass().getSimpleName(), id);
        return toWrapper(dao().persist(entity));
    }

    @Override
    @Transactional
    public W update(String id, W wrapper) {
        E entity = require(id);
        mapWrapperToEntity(wrapper, entity);
        beforeSave(entity);
        log.info("Updating {} {}", entity.getClass().getSimpleName(), id);
        return toWrapper(dao().merge(entity));
    }

    @Override
    @Transactional
    public void delete(String id) {
        E entity = require(id);
        checkDelete(entity);
        log.info("Deleting {} {}", entity.getClass().getSimpleName(), id);
        dao().remove(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return dao().count();
    }

    protected E require(String id) {
        return dao().findById(id).orElseThrow(() -> new ResourceNotFoundException(notFoundMessage()));
    }
}
