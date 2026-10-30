package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveControl;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResponse;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStateWrapper;

@Tag(name = "Hỏi trên lớp")
@RequestMapping("/api/live")
public interface LiveRest {

    @Operation(summary = "Trạng thái phiên hiện tại")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    ResponseEntity<LiveStateWrapper> state();

    @Operation(summary = "Giảng viên điều khiển phiên")
    @PreAuthorize("hasAnyRole('ADMIN','LECTURER')")
    @PutMapping
    ResponseEntity<LiveStateWrapper> control(@RequestBody LiveControl control);

    @Operation(summary = "Sinh viên tham gia hoặc trả lời")
    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/me")
    ResponseEntity<LiveStateWrapper> respond(@RequestBody LiveResponse response);
}
