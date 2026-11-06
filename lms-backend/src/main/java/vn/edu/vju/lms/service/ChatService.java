package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.wrapper.ChatWrappers.AskRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.ChatMessageWrapper;
import vn.edu.vju.lms.wrapper.ChatWrappers.GeneratedQuestion;
import vn.edu.vju.lms.wrapper.ChatWrappers.PracticeRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.PracticeSet;

public interface ChatService {

    ChatMessageWrapper ask(AskRequest request);

    List<ChatMessageWrapper> mine();

    ChatMessageWrapper rate(String id, String rating);

    /** UC-B07: never graded or stored, so a student can repeat it without limit on results. */
    PracticeSet practice(PracticeRequest request);

    /** UC-A01: draft quiz questions for a lecturer to review; they are not saved here. */
    List<GeneratedQuestion> suggestQuestions(PracticeRequest request);
}
