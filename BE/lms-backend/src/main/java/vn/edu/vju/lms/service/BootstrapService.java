package vn.edu.vju.lms.service;

import java.util.Map;

public interface BootstrapService {

    /** Everything the SPA needs after login, in its DemoData shape and filtered for the caller's role. */
    Map<String, Object> load();
}
