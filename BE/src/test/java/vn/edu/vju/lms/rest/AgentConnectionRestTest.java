package vn.edu.vju.lms.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.config.LmsProperties;

class AgentConnectionRestTest extends AbstractApiTest {
    @Autowired LmsProperties properties;
    HttpServer server;
    @AfterEach void cleanup() {
        if (server != null) server.stop(0);
        properties.getMcp().setInternalUrl(""); properties.getMcp().setInternalKey("");
    }
    @Test void onlyTeachingAccountsCanManageConnections() throws Exception {
        mvc.perform(get("/api/agent-connections")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/agent-connections").headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/agent-connections").headers(auth(ADMIN))).andExpect(status().isForbidden());
        mvc.perform(get("/api/agent-connections").headers(auth(LECTURER))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("disabled")).andExpect(jsonPath("$.mcpUrl").doesNotExist());
        mvc.perform(get("/api/agent-connections").headers(auth(LEADER))).andExpect(status().isOk());
    }
    @Test void forwardsAuthenticatedTokenAndPrivateServiceKeyNotUserSuppliedIdentity() throws Exception {
        var method = new AtomicReference<String>(); var token = new AtomicReference<String>();
        server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/internal/connections",exchange->{
            method.set(exchange.getRequestMethod()); token.set(exchange.getRequestHeaders().getFirst("Authorization"));
            assertThat(exchange.getRequestHeaders().getFirst("X-LMS-MCP-Key")).isEqualTo("test-service-key-01234567890123456789");
            String response=exchange.getRequestMethod().equals("GET")?"{\"status\":\"ready\",\"message\":\"\",\"mcpUrl\":\"https://example.test/mcp\",\"connections\":[{\"id\":\"own-grant\",\"clientName\":\"Claude\",\"scopes\":[\"lms:read\"],\"createdAt\":1,\"expiresAt\":9999999999}]}":"{\"revoked\":1}";
            byte[] data=response.getBytes(StandardCharsets.UTF_8);exchange.getResponseHeaders().add("Content-Type","application/json");exchange.sendResponseHeaders(200,data.length);exchange.getResponseBody().write(data);exchange.close();
        }); server.start();
        properties.getMcp().setInternalUrl("http://127.0.0.1:"+server.getAddress().getPort());properties.getMcp().setInternalKey("test-service-key-01234567890123456789");
        var headers=auth(LECTURER);
        mvc.perform(get("/api/agent-connections").headers(headers)).andExpect(status().isOk()).andExpect(jsonPath("$.mcpUrl").value("https://example.test/mcp")).andExpect(jsonPath("$.connections[0].clientName").value("Claude"));
        assertThat(token.get()).isEqualTo(headers.getFirst("Authorization"));
        mvc.perform(delete("/api/agent-connections/own-grant").headers(headers)).andExpect(status().isOk()).andExpect(jsonPath("$.revoked").value(1));assertThat(method.get()).isEqualTo("DELETE");
        mvc.perform(post("/api/agent-connections/revoke-all").headers(headers)).andExpect(status().isOk());assertThat(method.get()).isEqualTo("POST");
    }
    @Test void stoppedMcpNeverReturnsAStaleLink() throws Exception {
        properties.getMcp().setInternalUrl("http://127.0.0.1:1");properties.getMcp().setInternalKey("test-service-key-01234567890123456789");
        mvc.perform(get("/api/agent-connections").headers(auth(LECTURER))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("unavailable")).andExpect(jsonPath("$.mcpUrl").doesNotExist());
        mvc.perform(post("/api/agent-connections/revoke-all").headers(auth(LECTURER))).andExpect(status().isServiceUnavailable());
    }
}
