package vn.edu.vju.lms.service;

import vn.edu.vju.lms.wrapper.LiveWrappers.LiveControl;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResponse;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStateWrapper;

public interface LiveService {

    /** Reveals the question once time is up or everyone has answered, whoever polls first. */
    LiveStateWrapper state();

    LiveStateWrapper control(LiveControl control);

    LiveStateWrapper respond(LiveResponse response);
}
