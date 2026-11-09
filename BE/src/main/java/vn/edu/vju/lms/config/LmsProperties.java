package vn.edu.vju.lms.config;

import java.util.List;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "lms")
public class LmsProperties {

    private String timeZone = "Asia/Ho_Chi_Minh";

    /**
     * Opening and due times are typed in the browser without a zone, so the server must read them in the zone the
     * users' clocks show. A blank value means this machine's zone (development: browser and server share it).
     */
    public String getTimeZone() {
        return timeZone == null || timeZone.isBlank() ? java.time.ZoneId.systemDefault().getId() : timeZone;
    }
    private String defaultPassword = "12345678";
    private Cors cors = new Cors();
    private Security security = new Security();
    private Crypto crypto = new Crypto();
    private Storage storage = new Storage();
    private Ai ai = new Ai();
    private Seed seed = new Seed();
    private Reminder reminder = new Reminder();
    private Mcp mcp = new Mcp();

    @Data
    public static class Mcp {
        private String internalUrl = "";
        private String internalKey = "";
    }

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
        /** On an empty database: false loads only the accounts, without demo courses, lessons or results. */
        private boolean demo = true;
        /** At startup: delete all learning data and uploaded files but keep every account as it is. */
        private boolean clearKeepAccounts;
    }

    @Data
    public static class Reminder {
        private String cron = "0 0 * * * *";
        private String smtpHost = "";
        private String mailFrom = "no-reply@vju-learning.local";
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
