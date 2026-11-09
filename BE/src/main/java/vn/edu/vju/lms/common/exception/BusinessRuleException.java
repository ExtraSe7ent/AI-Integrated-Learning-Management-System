package vn.edu.vju.lms.common.exception;

/** A request that is well formed but breaks a rule; the message is shown to the user. */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
