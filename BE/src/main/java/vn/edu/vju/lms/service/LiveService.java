package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResultWrapper;

import vn.edu.vju.lms.wrapper.LiveWrappers.LiveControl;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResponse;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStateWrapper;

public interface LiveService {

    /** Reveals the question once time is up or everyone has answered, whoever polls first. */
    LiveStateWrapper state();

    LiveStateWrapper control(LiveControl control);

    LiveStateWrapper respond(LiveResponse response);

    /** Saved in-class results of the caller's classes, newest first; classId narrows to one class. */
    List<LiveResultWrapper> results(String classId);
}
