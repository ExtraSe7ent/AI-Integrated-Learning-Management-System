package vn.edu.vju.lms.rest.impl;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.vju.lms.rest.ChatRest;
import vn.edu.vju.lms.service.ChatService;
import vn.edu.vju.lms.wrapper.ChatWrappers.AskRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.ChatMessageWrapper;
import vn.edu.vju.lms.wrapper.ChatWrappers.RatingRequest;

@RestController
public class ChatRestImpl implements ChatRest {

    private final ChatService service;

    public ChatRestImpl(ChatService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<ChatMessageWrapper> ask(AskRequest request) {
        return ResponseEntity.ok(service.ask(request));
    }

    @Override
    public ResponseEntity<List<ChatMessageWrapper>> messages() {
        return ResponseEntity.ok(service.mine());
    }

    @Override
    public ResponseEntity<ChatMessageWrapper> rate(String id, RatingRequest request) {
        return ResponseEntity.ok(service.rate(id, request.rating()));
    }
}
