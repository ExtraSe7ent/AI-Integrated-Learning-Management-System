package vn.edu.vju.lms.dao;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.search.SearchOperation;
import vn.edu.vju.lms.common.search.SpecificationsBuilder;
import vn.edu.vju.lms.entity.ClassInfo;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ClassInfoDaoImplTest {

    @Autowired
    private IClassInfoDao dao;

    private ClassInfo persist(String id, String courseId) {
        ClassInfo entity = new ClassInfo();
        entity.setId(id);
        entity.setCourseId(courseId);
        entity.setName(id);
        entity.setTerm("I");
        entity.setYear("2026–2027");
        entity.setRound("1");
        entity.setTeacherId("GV001");
        entity.getStudentIds().add("S1");
        return dao.persist(entity);
    }

    @BeforeEach
    void data() {
        persist("DAO.01", "dao-c1");
        persist("DAO.02", "dao-c1");
        persist("DAO.03", "dao-c2");
    }

    @Test
    void findByName() {
        assertThat(dao.findByName("DAO.01")).isPresent();
        assertThat(dao.findByName("khong-co")).isEmpty();
    }

    @Test
    void courseQueries() {
        assertThat(dao.findByCourse("dao-c1")).hasSize(2);
        assertThat(dao.existsByCourse("dao-c2")).isTrue();
        assertThat(dao.existsByCourse("dao-cx")).isFalse();
    }

    @Test
    void findByStudentUsesEnrollment() {
        assertThat(dao.findByStudent("S1")).extracting(ClassInfo::getId).contains("DAO.01", "DAO.02", "DAO.03");
        assertThat(dao.findByStudent("S9")).isEmpty();
    }

    @Test
    void existsDuplicateIgnoresItself() {
        assertThat(dao.existsDuplicate("DAO.01", "DAO.01", "I", "2026–2027", "1")).isFalse();
        assertThat(dao.existsDuplicate("other", "dao.01", "I", "2026–2027", "1")).isTrue();
    }

    @Test
    void specificationSearchWithOperators() {
        var spec = new SpecificationsBuilder<ClassInfo>().with("id", SearchOperation.LIKE, "dao.0")
                .with("id", SearchOperation.GREATER_THAN, "DAO.01")
                .with("id", SearchOperation.LESS_THAN, "DAO.03").build();
        var page = dao.findAll(spec, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "id")));
        assertThat(page.getContent()).extracting(ClassInfo::getId).isEqualTo(List.of("DAO.02"));
    }

    @Test
    void persistMergeRemoveAndCount() {
        long before = dao.count();
        ClassInfo entity = persist("DAO.09", "dao-c9");
        assertThat(dao.count()).isEqualTo(before + 1);
        entity.setRound("3");
        assertThat(dao.merge(entity).getRound()).isEqualTo("3");
        dao.remove(entity);
        assertThat(dao.findById("DAO.09")).isEmpty();
        assertThat(dao.findAll()).hasSize((int) before);
    }
}
