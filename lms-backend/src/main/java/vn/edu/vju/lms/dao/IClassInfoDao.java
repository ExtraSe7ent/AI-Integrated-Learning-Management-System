package vn.edu.vju.lms.dao;

import java.util.List;
import java.util.Optional;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.ClassInfo;

public interface IClassInfoDao extends IGenericDao<String, ClassInfo> {

    Optional<ClassInfo> findByName(String name);

    boolean existsByCourse(String courseId);

    boolean existsDuplicate(String id, String name, String term, String year, String round);

    List<ClassInfo> findByStudent(String studentId);

    List<ClassInfo> findByCourse(String courseId);
}
