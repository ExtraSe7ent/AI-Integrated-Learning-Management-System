package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.wrapper.AttendanceWrapper;

class AttendanceRestTest extends AbstractApiTest {

    private static final String URL = "/api/attendances";

    private AttendanceWrapper sample(String id) {
        AttendanceWrapper wrapper = new AttendanceWrapper();
        wrapper.setId(id);
        wrapper.setClassId("CSE301.01");
        wrapper.setStudentId("23110149");
        wrapper.setDate("2026-10-16");
        wrapper.setStatus("present");
        return wrapper;
    }

    @Test
    void crudRoundTrip() throws Exception {
        mvc.perform(post(URL).headers(auth(LECTURER)).contentType(JSON).content(json(sample("t-1"))))
                .andExpect(status().isCreated());
        mvc.perform(get(URL + "/t-1").headers(auth(LECTURER))).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("t-1"));
        AttendanceWrapper change = new AttendanceWrapper();
        change.setClassId("CSE301.01 2");
        mvc.perform(put(URL + "/t-1").headers(auth(LECTURER)).contentType(JSON).content(json(change)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classId").value("CSE301.01 2"));
        mvc.perform(get(URL).headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(get(URL + "/count").headers(auth(LECTURER))).andExpect(status().isOk());
        String body = mvc.perform(get(URL + "/search").param("search", "id:t-1").param("sort", "id,desc").headers(auth(LECTURER)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(body).contains("t-1");
        mvc.perform(delete(URL + "/t-1").headers(auth(LECTURER))).andExpect(status().isNoContent());
        mvc.perform(get(URL + "/t-1").headers(auth(LECTURER))).andExpect(status().isNotFound());
    }

    @Test
    void rejectsDuplicateId() throws Exception {
        mvc.perform(post(URL).headers(auth(LECTURER)).contentType(JSON).content(json(sample("t-dup"))))
                .andExpect(status().isCreated());
        mvc.perform(post(URL).headers(auth(LECTURER)).contentType(JSON).content(json(sample("t-dup"))))
                .andExpect(status().isBadRequest());
        mvc.perform(delete(URL + "/t-dup").headers(auth(LECTURER))).andExpect(status().isNoContent());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    @Test
    void deniesWrongRole() throws Exception {
        mvc.perform(post(URL).headers(auth(STUDENT)).contentType(JSON).content(json(sample("t-2"))))
                .andExpect(status().isForbidden());
    }
}
