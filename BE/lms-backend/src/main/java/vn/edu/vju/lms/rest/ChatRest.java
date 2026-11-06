package vn.edu.vju.lms.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.edu.vju.lms.wrapper.ChatWrappers.AskRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.ChatMessageWrapper;
import vn.edu.vju.lms.wrapper.ChatWrappers.RatingRequest;

@Tag(name = "Trợ lý AI")
@RequestMapping("/api/ai")
@PreAuthorize("isAuthenticated()")
public interface ChatRest {

    @Operation(summary = "Hỏi trợ lý theo học liệu của học phần")
    @PostMapping("/ask")
    ResponseEntity<ChatMessageWrapper> ask(@Valid @RequestBody AskRequest request);

    @Operation(summary = "Lịch sử hỏi đáp của chính mình")
    @GetMapping("/messages")
    ResponseEntity<List<ChatMessageWrapper>> messages();

    @Operation(summary = "Đánh giá một câu trả lời")
    @PutMapping("/messages/{id}/rating")
    ResponseEntity<ChatMessageWrapper> rate(@PathVariable String id, @RequestBody RatingRequest request);
}
