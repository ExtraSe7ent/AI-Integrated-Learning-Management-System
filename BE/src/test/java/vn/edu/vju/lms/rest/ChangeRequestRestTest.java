package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.entity.CoordinationItem;
import vn.edu.vju.lms.wrapper.ChangeRequestWrapper;

class ChangeRequestRestTest extends AbstractApiTest {

    private static final String URL = "/api/coordination/requests";

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transaction;

    @BeforeEach
    void item() {
        CoordinationItem item = new CoordinationItem();
        item.setId("item-1");
        item.setCourseId("cs301");
        item.setClassId("CSE301.01");
        item.setKind("slides");
        item.setTitle("t");
        item.setBody("b");
        item.setEditable(true);
        item.setLevel(0);
        item.setRevision(1);
        transaction.executeWithoutResult(s -> entityManager.merge(item));
    }

    private ChangeRequestWrapper sample(String id) {
        ChangeRequestWrapper wrapper = new ChangeRequestWrapper();
        wrapper.setId(id);
        wrapper.setItemId("item-1");
        wrapper.setBody("Sửa giúp");
        wrapper.setReply("");
        wrapper.setClosed(false);
        return wrapper;
    }

    @Test
    void crudRoundTrip() throws Exception {
        mvc.perform(post(URL).headers(auth(LEADER)).contentType(JSON).content(json(sample("t-1"))))
                .andExpect(status().isCreated());
        mvc.perform(get(URL + "/t-1").headers(auth(LEADER))).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("t-1"));
        ChangeRequestWrapper change = new ChangeRequestWrapper();
        change.setItemId("item-1 2");
        mvc.perform(put(URL + "/t-1").headers(auth(LEADER)).contentType(JSON).content(json(change)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value("item-1 2"));
        mvc.perform(get(URL).headers(auth(LEADER))).andExpect(status().isOk());
        mvc.perform(get(URL + "/count").headers(auth(LEADER))).andExpect(status().isOk());
        String body = mvc.perform(get(URL + "/search").param("search", "id:t-1").param("sort", "id,desc").headers(auth(LEADER)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(body).contains("t-1");
        mvc.perform(delete(URL + "/t-1").headers(auth(LEADER))).andExpect(status().isNoContent());
        mvc.perform(get(URL + "/t-1").headers(auth(LEADER))).andExpect(status().isNotFound());
    }

    @Test
    void rejectsDuplicateId() throws Exception {
        mvc.perform(post(URL).headers(auth(LEADER)).contentType(JSON).content(json(sample("t-dup"))))
                .andExpect(status().isCreated());
        mvc.perform(post(URL).headers(auth(LEADER)).contentType(JSON).content(json(sample("t-dup"))))
                .andExpect(status().isBadRequest());
        mvc.perform(delete(URL + "/t-dup").headers(auth(LEADER))).andExpect(status().isNoContent());
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
