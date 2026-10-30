package vn.edu.vju.lms.common.jpa;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.List;
import java.util.Map;

/** JSON-in-TEXT columns, the same way the Django models used JSONField (and portable to H2). */
public final class JsonConverters {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonConverters() {
    }

    private abstract static class Base<T> implements AttributeConverter<T, String> {

        private final TypeReference<T> type;

        Base(TypeReference<T> type) {
            this.type = type;
        }

        @Override
        public String convertToDatabaseColumn(T value) {
            try {
                return value == null ? null : MAPPER.writeValueAsString(value);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Không ghi được JSON", e);
            }
        }

        @Override
        public T convertToEntityAttribute(String json) {
            try {
                return json == null ? null : MAPPER.readValue(json, type);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Không đọc được JSON", e);
            }
        }
    }

    @Converter
    public static class StringList extends Base<List<String>> {
        public StringList() {
            super(new TypeReference<>() { });
        }
    }

    @Converter
    public static class IntegerList extends Base<List<Integer>> {
        public IntegerList() {
            super(new TypeReference<>() { });
        }
    }

    @Converter
    public static class DoubleList extends Base<List<Double>> {
        public DoubleList() {
            super(new TypeReference<>() { });
        }
    }

    @Converter
    public static class IntegerMap extends Base<Map<String, Integer>> {
        public IntegerMap() {
            super(new TypeReference<>() { });
        }
    }

    @Converter
    public static class ObjectMap extends Base<Map<String, Object>> {
        public ObjectMap() {
            super(new TypeReference<>() { });
        }
    }
}
