package vn.edu.vju.lms.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.config.LmsProperties;

/** Exercises the HTTP layer against a local stub, so no real provider or API credit is involved. */
class OpenAiCompatibleClientTest {

    private record Reply(int status, String body) {
    }

    private final Deque<Reply> replies = new ArrayDeque<>();
    private final List<String> authorizations = new ArrayList<>();
    private HttpServer server;
    private OpenAiCompatibleClient client;
    private LmsProperties properties;

    @BeforeEach
    void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            authorizations.add(exchange.getRequestHeaders().getFirst("Authorization"));
            Reply reply = replies.removeFirst();
            byte[] bytes = reply.body().getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(reply.status(), bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        String base = "http://127.0.0.1:" + server.getAddress().getPort();
        properties = new LmsProperties();
        properties.getAi().setOpenrouterApiKey("or-key");
        properties.getAi().setVilaoApiKey("vi-key");
        properties.getAi().setOpenrouterBaseUrl(base);
        properties.getAi().setVilaoBaseUrl(base);
        client = new OpenAiCompatibleClient(properties, new ObjectMapper());
    }

    @AfterEach
    void stop() {
        server.stop(0);
    }

    private static String chat(String content) {
        return "{\"choices\":[{\"message\":{\"content\":" + new ObjectMapper().valueToTree(content) + "}}]}";
    }

    @Test
    void parsesJsonEvenInsideMarkdownFence() {
        replies.add(new Reply(200, chat("```json\n{\"ok\":true}\n```")));
        assertThat(client.chatJson(AiClient.ModelRole.CHAT, "s", "u", 10).path("ok").asBoolean()).isTrue();
        assertThat(authorizations).containsExactly("Bearer or-key");
    }

    @Test
    void fastRoleUsesItsOwnProvider() {
        replies.add(new Reply(200, chat("{}")));
        client.chatJson(AiClient.ModelRole.FAST, "s", "u", 10);
        assertThat(authorizations).containsExactly("Bearer vi-key");
    }

    @Test
    void retriesServerErrorsOnce() {
        replies.add(new Reply(503, ""));
        replies.add(new Reply(200, chat("{\"ok\":1}")));
        assertThat(client.chatJson(AiClient.ModelRole.CHAT, "s", "u", 10).has("ok")).isTrue();
    }

    @Test
    void doesNotRetryClientErrors() {
        replies.add(new Reply(401, ""));
        assertThatThrownBy(() -> client.chatJson(AiClient.ModelRole.CHAT, "s", "u", 10))
                .isInstanceOf(AiProviderException.class).hasMessageContaining("401");
        assertThat(authorizations).hasSize(1);
    }

    @Test
    void invalidJsonContentIsAProviderError() {
        replies.add(new Reply(200, chat("không phải json")));
        assertThatThrownBy(() -> client.chatJson(AiClient.ModelRole.CHAT, "s", "u", 10)).isInstanceOf(AiProviderException.class);
    }

    @Test
    void embedReturnsOneVectorPerText() {
        replies.add(new Reply(200, "{\"data\":[{\"embedding\":[0.5,1]},{\"embedding\":[2,3]}]}"));
        assertThat(client.embed(List.of("a", "b"))).containsExactly(List.of(0.5, 1.0), List.of(2.0, 3.0));
    }

    @Test
    void embedCountMismatchIsAnError() {
        replies.add(new Reply(200, "{\"data\":[]}"));
        assertThatThrownBy(() -> client.embed(List.of("a"))).isInstanceOf(AiProviderException.class);
    }

    @Test
    void unreachableProviderFailsAfterRetry() {
        server.stop(0);
        assertThatThrownBy(() -> client.chatJson(AiClient.ModelRole.CHAT, "s", "u", 10)).isInstanceOf(AiProviderException.class);
    }

    @Test
    void configurationFlagsFollowApiKeys() {
        assertThat(client.chatConfigured()).isTrue();
        assertThat(client.embeddingConfigured()).isTrue();
        assertThat(client.embeddingSignature()).contains("text-embedding-3-small");
        properties.getAi().setVilaoApiKey("");
        assertThat(client.chatConfigured()).isFalse();
        assertThat(client.embeddingConfigured()).isFalse();
    }
}
