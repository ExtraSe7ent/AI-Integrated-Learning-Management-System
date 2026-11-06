package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IRagChunkDao;
import vn.edu.vju.lms.entity.RagChunk;

@Repository
public class RagChunkDaoImpl extends HibernateGenericDao<Long, RagChunk> implements IRagChunkDao {

    public RagChunkDaoImpl() {
        super(RagChunk.class);
    }

    @Override
    public List<RagChunk> findByVersions(List<Long> versionIds) {
        if (versionIds.isEmpty()) {
            return List.of();
        }
        return list("SELECT c FROM RagChunk c WHERE c.versionId IN :ids", Map.of("ids", versionIds));
    }

    @Override
    public void deleteByMaterial(String materialId) {
        entityManager.createQuery("DELETE FROM RagChunk c WHERE c.materialId = :materialId")
                .setParameter("materialId", materialId)
                .executeUpdate();
    }
}
