package vn.edu.vju.lms.dao;

import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.RagChunk;

public interface IRagChunkDao extends IGenericDao<Long, RagChunk> {

    List<RagChunk> findByVersions(List<Long> versionIds);

    void deleteByMaterial(String materialId);
}
