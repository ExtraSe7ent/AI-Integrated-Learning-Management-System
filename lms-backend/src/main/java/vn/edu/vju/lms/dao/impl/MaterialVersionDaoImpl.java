package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IMaterialVersionDao;
import vn.edu.vju.lms.entity.MaterialVersion;

@Repository
public class MaterialVersionDaoImpl extends HibernateGenericDao<Long, MaterialVersion> implements IMaterialVersionDao {

    public MaterialVersionDaoImpl() {
        super(MaterialVersion.class);
    }

    @Override
    public Optional<MaterialVersion> find(String materialId, int number) {
        return single("SELECT v FROM MaterialVersion v WHERE v.materialId = :materialId AND v.number = :number",
                Map.of("materialId", materialId, "number", number));
    }

    @Override
    public List<MaterialVersion> findByMaterial(String materialId) {
        return list("SELECT v FROM MaterialVersion v WHERE v.materialId = :materialId", Map.of("materialId", materialId));
    }
}
