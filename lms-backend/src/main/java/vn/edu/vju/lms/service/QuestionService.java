package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.common.service.CrudService;
import vn.edu.vju.lms.wrapper.QuestionWrapper;

public interface QuestionService extends CrudService<QuestionWrapper> {

    /** UC-A01 AF-1: every row is saved or none is, so a bad line never leaves half a file imported. */
    List<QuestionWrapper> importQuestions(List<QuestionWrapper> rows);
}
