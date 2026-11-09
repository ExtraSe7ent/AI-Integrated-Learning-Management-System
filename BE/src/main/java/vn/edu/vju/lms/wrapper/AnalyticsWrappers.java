package vn.edu.vju.lms.wrapper;

import java.util.List;

public final class AnalyticsWrappers {

    private AnalyticsWrappers() {
    }

    /**
     * correctRate is the share of auto-graded (choice and fill-in) answers that were right, null with no such
     * answers; lastSubmitted is the latest submission time as shown to students (UC-F01 b, c).
     */
    public record StudentReport(String id, String name, String email, int progress, double selfStudy, double average,
            int submitted, int chats, Integer correctRate, String lastSubmitted, int feedback) {
    }

    public record ClassReport(String id, String name, String courseId, String courseCode, String courseTitle,
            String teacher, String term, String year, List<StudentReport> students) {
    }

    /** Quiz and knowledge-gap signals for one slide, across every student. */
    public record PageReport(int page, int answered, int wrong, int gaps) {
    }

    public record Report(List<ClassReport> classes, List<PageReport> pages) {
    }
}
