package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.wrapper.ChatWrappers.AskRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.ChatMessageWrapper;

public interface ChatService {

    ChatMessageWrapper ask(AskRequest request);

    List<ChatMessageWrapper> mine();

    ChatMessageWrapper rate(String id, String rating);
}
