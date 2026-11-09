package vn.edu.vju.lms.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.entity.ClassInfo;

class IndirectClassScopeRestTest extends AbstractApiTest {
    @Test void outsideStudentCannotReadQuizOrSessionOfAnotherClass() throws Exception {
        String cls="indirect-"+UUID.randomUUID(),lesson=cls+"-l",q=cls+"-q",session=cls+"-s";
        tx.executeWithoutResult(s->{ClassInfo c=new ClassInfo();c.setId(cls);c.setCourseId("cs301");c.setName(cls);c.setTerm("I");c.setYear("2026-2027");c.setRound("1");c.setTeacherId(LECTURER);c.setStudentIds(new ArrayList<>(List.of(STUDENT)));classDao.persist(c);});
        mvc.perform(post("/api/lessons").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("id",lesson,"classId",cls,"title","Scope","published",true,"slides",List.of("Page"))))).andExpect(status().isCreated());
        mvc.perform(post("/api/questions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("id",q,"lessonId",lesson,"text","Q?","options",List.of("A","B","C","D"),"correct",0,"page",1,"approved",true)))).andExpect(status().isCreated());
        mvc.perform(post("/api/sessions").headers(auth(LECTURER)).contentType(JSON).content(json(Map.of("id",session,"lessonId",lesson,"title","Session","published",true,"opens","2020-01-01T00:00","closes","2099-01-01T00:00")))).andExpect(status().isCreated());
        mvc.perform(get("/api/questions/"+q).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/questions").headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$[*].id",not(hasItem(q))));
        mvc.perform(get("/api/sessions/"+session).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/sessions/search").param("search","id:"+session).headers(auth(OTHER_STUDENT))).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/questions/"+q).headers(auth(STUDENT))).andExpect(status().isOk()).andExpect(jsonPath("$.correct").doesNotExist());
    }
}
