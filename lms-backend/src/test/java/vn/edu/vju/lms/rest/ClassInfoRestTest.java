package vn.edu.vju.lms.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.ICourseDao;
import vn.edu.vju.lms.entity.Course;
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;

class ClassInfoRestTest extends AbstractApiTest {

    private static final String URL = "/api/class-info";

    @Autowired
    private ICourseDao courseDao;

    @BeforeEach
    void course() {
        if (courseDao.findById("c1").isEmpty()) {
            Course course = new Course();
            course.setId("c1");
            course.setCode("C1");
            course.setTitle("Học phần");
            course.setFaculty("CNTT");
            tx.executeWithoutResult(s -> courseDao.persist(course));
        }
    }

    private ClassInfoWrapper sample(String name) {
        ClassInfoWrapper wrapper = new ClassInfoWrapper();
        wrapper.setId(name);
        wrapper.setCourseId("c1");
        wrapper.setName(name);
        wrapper.setTerm("I");
        wrapper.setYear("2026–2027");
        wrapper.setRound("1");
        wrapper.setTeacherId(LECTURER);
        return wrapper;
    }

    private String create(ClassInfoWrapper wrapper) throws Exception {
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper))).andExpect(status().isCreated());
        return wrapper.getId();
    }

    private String unique() {
        return "L" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void adminHasFullCrud() throws Exception {
        String id = create(sample(unique()));
        ClassInfoWrapper change = new ClassInfoWrapper();
        change.setRound("2");
        mvc.perform(put(URL + "/" + id).headers(auth(ADMIN)).contentType(JSON).content(json(change)))
                .andExpect(jsonPath("$.round").value("2"))
                .andExpect(jsonPath("$.name").value(id));
        mvc.perform(get(URL + "/count").headers(auth(ADMIN))).andExpect(status().isOk());
        mvc.perform(delete(URL + "/" + id).headers(auth(ADMIN))).andExpect(status().isNoContent());
        mvc.perform(get(URL + "/" + id).headers(auth(ADMIN))).andExpect(status().isNotFound());
    }

    @Test
    void lecturerCreatesAndUpdatesButCannotDeleteOrCount() throws Exception {
        ClassInfoWrapper wrapper = sample(unique());
        mvc.perform(post(URL).headers(auth(LECTURER)).contentType(JSON).content(json(wrapper))).andExpect(status().isCreated());
        mvc.perform(put(URL + "/" + wrapper.getId()).headers(auth(LECTURER)).contentType(JSON).content(json(wrapper)))
                .andExpect(status().isOk());
        mvc.perform(delete(URL + "/" + wrapper.getId()).headers(auth(LECTURER))).andExpect(status().isForbidden());
        mvc.perform(get(URL + "/count").headers(auth(LECTURER))).andExpect(status().isForbidden());
    }

    @Test
    void studentIsReadOnly() throws Exception {
        String id = create(sample(unique()));
        mvc.perform(get(URL).headers(auth(STUDENT))).andExpect(status().isOk());
        mvc.perform(get(URL + "/" + id).headers(auth(STUDENT))).andExpect(status().isOk());
        mvc.perform(get(URL + "/by-name").param("name", id).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.id").value(id));
        mvc.perform(post(URL).headers(auth(STUDENT)).contentType(JSON).content(json(sample(unique()))))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownNameIsNotFound() throws Exception {
        mvc.perform(get(URL + "/by-name").param("name", "khong-co").headers(auth(ADMIN))).andExpect(status().isNotFound());
    }

    @Test
    void searchSortsAndPaginates() throws Exception {
        String prefix = "S" + UUID.randomUUID().toString().substring(0, 6);
        create(sample(prefix + "A"));
        create(sample(prefix + "B"));
        create(sample(prefix + "C"));
        mvc.perform(get(URL + "/search").headers(auth(STUDENT))
                .param("search", "name~" + prefix + ",term:I,round!9")
                .param("sort", "name,desc").param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name").value(prefix + "C"))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get(URL + "/search").headers(auth(STUDENT)).param("search", "khongtontai:1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validatesClassRules() throws Exception {
        ClassInfoWrapper wrapper = sample(unique());
        wrapper.setCourseId("khong-co");
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Học phần không tồn tại."));
        wrapper = sample(unique());
        wrapper.setYear("2026");
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper))).andExpect(status().isBadRequest());
        wrapper = sample(unique());
        wrapper.setRound("0");
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper))).andExpect(status().isBadRequest());
        wrapper = sample(unique());
        wrapper.setTeacherId(STUDENT);
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper)))
                .andExpect(jsonPath("$.message").value("Chọn giảng viên đang hoạt động."));
        wrapper = sample(unique());
        wrapper.setLeaderId(LECTURER);
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper)))
                .andExpect(jsonPath("$.message").value("Chọn Trưởng nhóm HP đang hoạt động."));
        wrapper.setLeaderId(LEADER);
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper))).andExpect(status().isCreated());
        wrapper.setId(unique());
        mvc.perform(post(URL).headers(auth(ADMIN)).contentType(JSON).content(json(wrapper)))
                .andExpect(jsonPath("$.message").value("Lớp đã tồn tại trong kỳ và đợt này."));
    }

    @Test
    void enrollmentIsAllOrNothing() throws Exception {
        String id = create(sample(unique()));
        mvc.perform(post(URL + "/" + id + "/enroll").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(STUDENT, "khong-co"))))
                .andExpect(status().isBadRequest());
        mvc.perform(get(URL + "/" + id).headers(auth(ADMIN))).andExpect(jsonPath("$.studentIds", hasSize(0)));
        mvc.perform(post(URL + "/" + id + "/enroll").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(STUDENT))))
                .andExpect(jsonPath("$.studentIds", hasSize(1)));
        mvc.perform(post(URL + "/" + id + "/enroll").headers(auth(ADMIN)).contentType(JSON).content(json(List.of(STUDENT))))
                .andExpect(status().isBadRequest());
        mvc.perform(post(URL + "/" + id + "/enroll").headers(auth(ADMIN)).contentType(JSON).content("[]"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void courseWithClassesCannotBeDeleted() throws Exception {
        create(sample(unique()));
        mvc.perform(delete("/api/courses/c1").headers(auth(ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Học phần đang có lớp, không thể xóa."));
    }
}
