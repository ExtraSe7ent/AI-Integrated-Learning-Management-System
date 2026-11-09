package vn.edu.vju.lms.rest;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.vju.lms.service.AgentConnectionService;

@RestController
@RequestMapping("/api/agent-connections")
@PreAuthorize("hasAnyRole('LECTURER','COURSE_LEADER')")
public class AgentConnectionRest {
    private final AgentConnectionService service;
    public AgentConnectionRest(AgentConnectionService service) { this.service=service; }
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public org.springframework.http.ResponseEntity<java.util.Map<String,String>> error(org.springframework.web.server.ResponseStatusException error) {
        return org.springframework.http.ResponseEntity.status(error.getStatusCode()).body(java.util.Map.of("message",error.getReason()==null?"Không thể quản lý kết nối agent.":error.getReason()));
    }
    @GetMapping
    public AgentConnectionService.Settings get(@RequestHeader("Authorization") String token) { return service.settings(token); }
    @DeleteMapping("/{id}")
    public AgentConnectionService.Revoked revoke(@PathVariable String id,@RequestHeader("Authorization") String token) { return service.revoke(id,token); }
    @PostMapping("/revoke-all")
    public AgentConnectionService.Revoked revokeAll(@RequestHeader("Authorization") String token) { return service.revokeAll(token); }
}
