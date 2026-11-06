package vn.edu.vju.lms.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import vn.edu.vju.lms.entity.ClassInfo;

/** Spring Data side of ClassInfo: specification search with sorting and pagination. */
public interface ClassInfoRepository extends JpaRepository<ClassInfo, String>, JpaSpecificationExecutor<ClassInfo> {
}
