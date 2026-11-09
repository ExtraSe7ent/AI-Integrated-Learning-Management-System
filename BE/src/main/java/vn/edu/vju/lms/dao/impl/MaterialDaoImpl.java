package vn.edu.vju.lms.dao.impl;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IMaterialDao;
import vn.edu.vju.lms.entity.Material;

@Repository
public class MaterialDaoImpl extends HibernateGenericDao<String, Material> implements IMaterialDao {

    public MaterialDaoImpl() {
        super(Material.class);
    }

    @Override
    public List<Material> findByClass(String classId) {
        return list("SELECT m FROM Material m WHERE m.classId = :classId ORDER BY m.weekNumber, m.title",
                Map.of("classId", classId));
    }

    @Override
    public List<Material> findIndexedByClasses(List<String> classIds) {
        if (classIds.isEmpty()) {
            return List.of();
        }
        return list("SELECT m FROM Material m WHERE m.classId IN :ids AND m.status = :status AND m.indexStatus = :ready",
                Map.of("ids", classIds, "status", Material.PUBLISHED, "ready", Material.INDEX_READY));
    }

    @Override
    public boolean claimForIndexing(String id, Instant now, Instant staleBefore) {
        return entityManager.createQuery("""
                UPDATE Material m SET m.indexStatus = :processing, m.indexStartedAt = :now, m.indexError = ''
                WHERE m.id = :id AND (m.indexStatus <> :processing OR m.indexStartedAt IS NULL OR m.indexStartedAt < :stale)
                """)
                .setParameter("processing", Material.INDEX_PROCESSING)
                .setParameter("now", now)
                .setParameter("stale", staleBefore)
                .setParameter("id", id)
                .executeUpdate() == 1;
    }
}
