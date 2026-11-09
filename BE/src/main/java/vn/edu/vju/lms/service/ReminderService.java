package vn.edu.vju.lms.service;

import java.util.List;
import java.util.Map;
import vn.edu.vju.lms.common.service.CrudService;
import vn.edu.vju.lms.wrapper.ReminderWrapper;

public interface ReminderService extends CrudService<ReminderWrapper> {

    /** Unfinished work due within 24 hours of the given local time; null means now. */
    List<Map<String, Object>> candidates(String at);

    /** UC-G03: sends what is due, skipping anything already sent, and records every attempt. */
    List<ReminderWrapper> scan(String at);
}
