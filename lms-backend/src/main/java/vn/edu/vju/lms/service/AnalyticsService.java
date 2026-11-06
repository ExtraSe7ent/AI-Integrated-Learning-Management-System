package vn.edu.vju.lms.service;

import vn.edu.vju.lms.wrapper.AnalyticsWrappers.Report;

public interface AnalyticsService {

    /** Learning data of the classes the caller is responsible for; deans and admins see every class. */
    Report report();
}
