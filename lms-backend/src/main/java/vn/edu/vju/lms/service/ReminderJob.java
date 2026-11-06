package vn.edu.vju.lms.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** UC-G03's cron trigger. The scan is idempotent, so running it hourly sends each reminder once. */
@Component
public class ReminderJob {

    private final ReminderService reminders;

    public ReminderJob(ReminderService reminders) {
        this.reminders = reminders;
    }

    @Scheduled(cron = "${lms.reminder.cron}", zone = "${lms.time-zone}")
    public void scan() {
        reminders.scan(null);
    }
}
