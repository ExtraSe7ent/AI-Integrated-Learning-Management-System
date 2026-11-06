package vn.edu.vju.lms.dao;

import java.time.Instant;
import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.Material;

public interface IMaterialDao extends IGenericDao<String, Material> {

    List<Material> findByClass(String classId);

    List<Material> findIndexedByClasses(List<String> classIds);

    /** Compare-and-set, so two workers never index the same file; claims older than staleBefore are dead. */
    boolean claimForIndexing(String id, Instant now, Instant staleBefore);
}
