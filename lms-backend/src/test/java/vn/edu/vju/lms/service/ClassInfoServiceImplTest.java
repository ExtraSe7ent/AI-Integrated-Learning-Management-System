package vn.edu.vju.lms.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Course;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.service.impl.ClassInfoServiceImpl;
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;

@ExtendWith(MockitoExtension.class)
class ClassInfoServiceImplTest {

    @Mock
    private IClassInfoDao classInfoDao;

    @Mock
    private ICourseDao courseDao;

    @Mock
    private IUserAccountDao userDao;

    @InjectMocks
    private ClassInfoServiceImpl service;

    private ClassInfo entity;

    @BeforeEach
    void setUp() {
        entity = new ClassInfo();
        entity.setId("CSE301.01");
        entity.setCourseId("cs301");
        entity.setName("CSE301.01");
        entity.setTerm("I");
        entity.setYear("2026–2027");
        entity.setRound("1");
        entity.setTeacherId("GV001");
    }

    private void validReferences() {
        UserAccount teacher = new UserAccount();
        teacher.setKind("teacher");
        when(courseDao.findById("cs301")).thenReturn(Optional.of(new Course()));
        when(userDao.findById("GV001")).thenReturn(Optional.of(teacher));
    }

    @Test
    void getReturnsWrapper() {
        when(classInfoDao.findById("CSE301.01")).thenReturn(Optional.of(entity));
        assertThat(service.get("CSE301.01").getName()).isEqualTo("CSE301.01");
    }

    @Test
    void getThrowsWhenMissing() {
        when(classInfoDao.findById("x")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get("x")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateOnlyTouchesNonNullFields() {
        when(classInfoDao.findById("CSE301.01")).thenReturn(Optional.of(entity));
        when(classInfoDao.merge(any())).thenAnswer(call -> call.getArgument(0));
        validReferences();
        ClassInfoWrapper change = new ClassInfoWrapper();
        change.setRound("2");

        ClassInfoWrapper result = service.update("CSE301.01", change);

        assertThat(result.getRound()).isEqualTo("2");
        assertThat(result.getName()).isEqualTo("CSE301.01");
        assertThat(result.getTerm()).isEqualTo("I");
    }

    @Test
    void createRejectsUnknownCourseAndDoesNotPersist() {
        when(classInfoDao.findById("L1")).thenReturn(Optional.empty());
        when(courseDao.findById("cs301")).thenReturn(Optional.empty());
        ClassInfoWrapper wrapper = new ClassInfoWrapper();
        wrapper.setId("L1");
        wrapper.setCourseId("cs301");

        assertThatThrownBy(() -> service.create(wrapper)).isInstanceOf(BusinessRuleException.class);
        verify(classInfoDao, never()).persist(any());
    }

    @Test
    void createRejectsDuplicateClassInSameTerm() {
        when(classInfoDao.findById("L1")).thenReturn(Optional.empty());
        when(courseDao.findById("cs301")).thenReturn(Optional.of(new Course()));
        when(classInfoDao.existsDuplicate(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(true);
        ClassInfoWrapper wrapper = new ClassInfoWrapper();
        wrapper.setId("L1");
        wrapper.setCourseId("cs301");
        wrapper.setName("L1");
        wrapper.setTerm("I");
        wrapper.setYear("2026-2027");
        wrapper.setRound("1");

        assertThatThrownBy(() -> service.create(wrapper)).hasMessageContaining("đã tồn tại");
    }

    @Test
    void deleteRemovesEntity() {
        when(classInfoDao.findById("CSE301.01")).thenReturn(Optional.of(entity));
        service.delete("CSE301.01");
        verify(classInfoDao).remove(entity);
    }
}
