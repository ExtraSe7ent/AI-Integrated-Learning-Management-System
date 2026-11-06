package vn.edu.vju.lms.service;

public interface CoordinationCompletionService {

    /** Needs slides, quiz and assignment, every item at M3, and no open request. */
    void complete(String classId);

    void reopen(String classId);
}
