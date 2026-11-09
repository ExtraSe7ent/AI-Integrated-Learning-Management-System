package vn.edu.vju.lms.dao.impl;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.repository.ClassInfoRepository;
import vn.edu.vju.lms.entity.ClassInfo;

@Repository
public class ClassInfoDaoImpl extends HibernateGenericDao<String, ClassInfo> implements IClassInfoDao {

    private final ClassInfoRepository repository;

    public ClassInfoDaoImpl(ClassInfoRepository repository) {
        super(ClassInfo.class);
        this.repository = repository;
    }

    @Override
    public Page<ClassInfo> findAll(Specification<ClassInfo> specification, Pageable pageable) {
        return repository.findAll(specification, pageable);
    }

    @Override
    public Optional<ClassInfo> findByName(String name) {
        return single("SELECT c FROM ClassInfo c WHERE c.name = :name", Map.of("name", name));
    }

    @Override
    public boolean existsByCourse(String courseId) {
        return !findByCourse(courseId).isEmpty();
    }

    @Override
    public boolean existsDuplicate(String id, String name, String term, String year, String round) {
        return single("""
                SELECT c FROM ClassInfo c
                WHERE LOWER(c.name) = LOWER(:name) AND c.term = :term AND c.year = :year
                  AND c.round = :round AND c.id <> :id
                """, Map.of("name", name, "term", term, "year", year, "round", round, "id", id)).isPresent();
    }

    @Override
    public List<ClassInfo> findByStudent(String studentId) {
        return list("SELECT c FROM ClassInfo c WHERE :studentId MEMBER OF c.studentIds", Map.of("studentId", studentId));
    }

    @Override
    public List<ClassInfo> findByCourse(String courseId) {
        return list("SELECT c FROM ClassInfo c WHERE c.courseId = :courseId", Map.of("courseId", courseId));
    }
}
