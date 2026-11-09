package vn.edu.vju.lms.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.entity.ClassInfo;

class ClassScopeSecurityRestTest extends AbstractApiTest {
    private String cls, lesson;
    @BeforeEach
    void classFixture() throws Exception {
        cls="scope-"+UUID.randomUUID();lesson=cls+"-lesson";
        tx.executeWithoutResult(s->{ClassInfo c=new ClassInfo();c.setId(cls);c.setCourseId("cs301");c.setName(cls);c.setTerm("I");c.setYear("2026-2027");c.setRound("1");c.setTeacherId(LECTURER);c.setStudentIds(new ArrayList<>(List.of(STUDENT)));classDao.persist(c);});
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("id",lesson,"classId",cls,"title","Scoped lesson","published",true,"slides",List.of("Page 1")))))
            .andExpect(status().isCreated());
    }
    @Test void outsiderCannotReadLessonOrClassThroughDirectApis() throws Exception {
        mvc.perform(get("/api/lessons/"+lesson).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/class-info/"+cls).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/class-info/by-name").param("name",cls).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
    }
    @Test void enrollmentIsEnforcedBeforeSearchPaginationAndCount() throws Exception {
        mvc.perform(get("/api/lessons").headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$[*].id",not(hasItem(lesson))));
        mvc.perform(get("/api/lessons/search").param("search","id:"+lesson).headers(auth(OTHER_STUDENT)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/class-info/search").param("search","id:"+cls).headers(auth(OTHER_STUDENT)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }
    @Test void enrolledStudentSeesOnlyOwnRosterIdentity() throws Exception {
        tx.executeWithoutResult(s->classDao.findById(cls).orElseThrow().getStudentIds().add(OTHER_STUDENT));
        mvc.perform(get("/api/class-info/"+cls).headers(auth(STUDENT)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.studentIds",contains(STUDENT)));
        mvc.perform(get("/api/lessons/"+lesson).headers(auth(STUDENT))).andExpect(status().isOk());
    }
    @Test void unpublishedLessonAndItsQuestionsAreNotReadableByStudent() throws Exception {
        mvc.perform(put("/api/lessons/"+lesson).headers(auth(LECTURER)).contentType(JSON).content("{\"published\":false}")).andExpect(status().isOk());
        mvc.perform(get("/api/lessons/"+lesson).headers(auth(STUDENT))).andExpect(status().isForbidden());
    }
}
