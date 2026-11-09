package vn.edu.vju.lms.common.exception;

/** The caller's role is allowed on the endpoint, but not on this particular record. */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
