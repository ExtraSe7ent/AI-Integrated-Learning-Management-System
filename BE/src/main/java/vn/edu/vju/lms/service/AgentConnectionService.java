package vn.edu.vju.lms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.vju.lms.config.LmsProperties;

/** The web never receives the service key or the backend/MCP bearer tokens. */
@Service
public class AgentConnectionService {
    public record Connection(String id, String clientName, List<String> scopes, long createdAt, long expiresAt) { }
    public record Settings(String status, String message, String mcpUrl, List<Connection> connections) { }
    public record Revoked(int revoked) { }
    private final LmsProperties properties;
    private final ObjectMapper mapper;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2))
            .followRedirects(HttpClient.Redirect.NEVER).build();

    public AgentConnectionService(LmsProperties properties, ObjectMapper mapper) {
        this.properties = properties; this.mapper = mapper;
    }
    private boolean configured() {
        return !properties.getMcp().getInternalUrl().isBlank() && properties.getMcp().getInternalKey().length() >= 32;
    }
    private <T> T request(String path, String method, String token, Class<T> type) {
        if (!configured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chưa bật kết nối agent AI.");
        try {
            URI base=URI.create(properties.getMcp().getInternalUrl());
            // A local service bridge, never a URL supplied by a student/agent or a forwarded Host header.
            if (!List.of("127.0.0.1", "localhost", "[::1]").contains(base.getHost())
                    || !"http".equals(base.getScheme()) || base.getUserInfo()!=null || base.getQuery()!=null
                    || base.getFragment()!=null || !(base.getPath().isEmpty() || base.getPath().equals("/"))) {
                throw new IllegalArgumentException("Invalid bridge origin");
            }
            var request=HttpRequest.newBuilder(base.resolve(path)).timeout(Duration.ofSeconds(5))
                    .header("Authorization", token).header("X-LMS-MCP-Key",properties.getMcp().getInternalKey())
                    .method(method,HttpRequest.BodyPublishers.noBody()).build();
            var response=client.send(request,HttpResponse.BodyHandlers.ofString());
            if(response.statusCode()==404) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy kết nối của bạn.");
            if(response.statusCode()!=200) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Chưa thể quản lý kết nối agent. Hãy thử lại.");
            return mapper.readValue(response.body(),type);
        } catch(ResponseStatusException e) { throw e;
        } catch(InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Dịch vụ kết nối agent đang gián đoạn.");
        } catch(Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Dịch vụ kết nối agent đang tắt hoặc không phản hồi.");
        }
    }
    public Settings settings(String token) {
        if(!configured()) return new Settings("disabled","Kết nối agent AI chưa được bật. Liên hệ người quản trị hệ thống.",null,List.of());
        try {
            Settings data=request("/internal/connections","GET",token,Settings.class);
            if(!List.of("ready","local","disabled").contains(data.status()) || data.connections()==null) throw new IllegalArgumentException();
            if("ready".equals(data.status())) {
                URI url=URI.create(data.mcpUrl());
                if(!"https".equals(url.getScheme()) || url.getHost()==null || url.getUserInfo()!=null || url.getQuery()!=null || url.getFragment()!=null || !"/mcp".equals(url.getPath())) throw new IllegalArgumentException();
            } else if(data.mcpUrl()!=null) throw new IllegalArgumentException();
            return data;
        } catch(Exception e) {
            return new Settings("unavailable","Không kết nối được dịch vụ agent AI. Link tạm thời không được hiển thị để tránh dùng nhầm link cũ.",null,List.of());
        }
    }
    public Revoked revoke(String id,String token) {
        if(!id.matches("[A-Za-z0-9_-]{1,128}")) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy kết nối của bạn.");
        return request("/internal/connections/"+id,"DELETE",token,Revoked.class);
    }
    public Revoked revokeAll(String token) { return request("/internal/connections/revoke-all","POST",token,Revoked.class); }
}
