package vn.edu.vju.lms.config;

import java.util.List;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "lms")
public class LmsProperties {

    private String timeZone = "Asia/Ho_Chi_Minh";
    private String defaultPassword = "12345678";
    private Cors cors = new Cors();
    private Security security = new Security();
    private Crypto crypto = new Crypto();
    private Storage storage = new Storage();
    private Ai ai = new Ai();
    private Seed seed = new Seed();

    @Data
    public static class Cors {
        private List<String> allowedOrigins = List.of();
    }

    @Data
    public static class Security {
        private String jwtSecret;
        private long jwtTtlMinutes = 1440;
    }

    @Data
    public static class Crypto {
        private String passphrase;
        private String salt;
        private int iterations = 310000;
    }

    @Data
    public static class Storage {
        private String root = "./private_media";
        private long pdfMaxMb = 50;
        private long videoMaxMb = 500;
    }

    @Data
    public static class Seed {
        private boolean enabled;
    }

    @Data
    public static class Ai {
        private int dailyLimitStudent = 40;
        private int dailyLimitTeacher = 200;
        private int maxChunks = 160;
        private String openrouterApiKey = "";
        private String openrouterBaseUrl = "https://openrouter.ai/api/v1";
        private String vilaoApiKey = "";
        private String vilaoBaseUrl = "https://api.vilao.ai/v1";
        private String chatProvider = "openrouter";
        private String chatModel = "google/gemini-2.5-flash";
        private String fastProvider = "vilao";
        private String fastModel = "gemini-3.8-flash";
        private String embedProvider = "vilao";
        private String embedModel = "text-embedding-3-small";
        private int embedDim = 1536;
    }
}
