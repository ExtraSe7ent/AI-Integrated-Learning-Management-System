package vn.edu.vju.lms.common.service;

import java.util.List;
import vn.edu.vju.lms.common.web.PageResponse;

public interface CrudService<W> {

    W get(String id);

    List<W> listAll();

    PageResponse<W> search(String search, int page, int size, String sort);

    W create(W wrapper);

    W update(String id, W wrapper);

    void delete(String id);

    long count();
}
