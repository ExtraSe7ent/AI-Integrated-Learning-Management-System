package vn.edu.vju.lms.ai;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public interface AiClient {

    enum ModelRole { FAST, CHAT }

    /** False without API keys: the LMS then answers from rules and keyword search only. */
    boolean chatConfigured();

    boolean embeddingConfigured();

    JsonNode chatJson(ModelRole role, String system, String user, int maxTokens);

    List<List<Double>> embed(List<String> texts);

    /** Vectors from different models or dimensions must never be compared. */
    String embeddingSignature();
}
