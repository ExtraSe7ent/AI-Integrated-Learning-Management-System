package vn.edu.vju.lms.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.config.LmsProperties;

/** Chat and embeddings over the OpenAI-compatible APIs of OpenRouter and Vilao; keys stay server-side. */
@Component
public class OpenAiCompatibleClient implements AiClient {

    private static final Duration CHAT_TIMEOUT = Duration.ofSeconds(60);
    private static final int MAX_ATTEMPTS = 2;

    private final LmsProperties.Ai config;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public OpenAiCompatibleClient(LmsProperties properties, ObjectMapper mapper) {
        this.config = properties.getAi();
        this.mapper = mapper;
    }

    @Override
    public boolean chatConfigured() {
        return StringUtils.hasText(key(config.getChatProvider())) && StringUtils.hasText(key(config.getFastProvider()));
    }

    @Override
    public boolean embeddingConfigured() {
        return StringUtils.hasText(key(config.getEmbedProvider()));
    }

    @Override
    public String embeddingSignature() {
        return config.getEmbedProvider() + "/" + config.getEmbedModel() + "/" + config.getEmbedDim();
    }

    @Override
    public JsonNode chatJson(ModelRole role, String system, String user, int maxTokens) {
        String provider = role == ModelRole.FAST ? config.getFastProvider() : config.getChatProvider();
        String model = role == ModelRole.FAST ? config.getFastModel() : config.getChatModel();
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "temperature", 0,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(Map.of("role", "system", "content", system), Map.of("role", "user", "content", user)));
        String content = post(provider, "/chat/completions", body).path("choices").path(0).path("message").path("content").asText("");
        try {
            return mapper.readTree(stripFence(content));
        } catch (JsonProcessingException e) {
            throw new AiProviderException("LLM: phản hồi không phải JSON hợp lệ.", e);
        }
    }

    @Override
    public List<List<Double>> embed(List<String> texts) {
        Map<String, Object> body = Map.of("model", config.getEmbedModel(), "input", texts, "dimensions", config.getEmbedDim());
        JsonNode data = post(config.getEmbedProvider(), "/embeddings", body).path("data");
        if (!data.isArray() || data.size() != texts.size()) {
            throw new AiProviderException("Embedding: số vector không khớp số đoạn văn.");
        }
        List<List<Double>> vectors = new ArrayList<>();
        data.forEach(item -> {
            List<Double> vector = new ArrayList<>();
            item.path("embedding").forEach(value -> vector.add(value.asDouble()));
            vectors.add(vector);
        });
        return vectors;
    }

    private JsonNode post(String provider, String path, Object body) {
        AiProviderException failure = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl(provider) + path))
                        .timeout(CHAT_TIMEOUT)
                        .header("Authorization", "Bearer " + key(provider))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                        .build();
                HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() / 100 == 2) {
                    return mapper.readTree(response.body());
                }
                failure = new AiProviderException("Nhà cung cấp AI trả lỗi HTTP " + response.statusCode() + ".");
                if (response.statusCode() < 500 && response.statusCode() != 429) {
                    throw failure;
                }
            } catch (IOException e) {
                failure = new AiProviderException("Không gọi được nhà cung cấp AI.", e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AiProviderException("Yêu cầu AI bị hủy.", e);
            }
        }
        throw failure;
    }

    private String baseUrl(String provider) {
        return "vilao".equals(provider) ? config.getVilaoBaseUrl() : config.getOpenrouterBaseUrl();
    }

    private String key(String provider) {
        return "vilao".equals(provider) ? config.getVilaoApiKey() : config.getOpenrouterApiKey();
    }

    private static String stripFence(String content) {
        return content.strip().replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
    }
}
