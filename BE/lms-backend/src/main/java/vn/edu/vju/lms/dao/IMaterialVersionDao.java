package vn.edu.vju.lms.dao;

import java.util.List;
import java.util.Optional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.MaterialVersion;

public interface IMaterialVersionDao extends IGenericDao<Long, MaterialVersion> {

    Optional<MaterialVersion> find(String materialId, int number);

    List<MaterialVersion> findByMaterial(String materialId);
}
