package vn.edu.vju.lms.service;

import java.util.List;
import vn.edu.vju.lms.common.service.CrudService;
import vn.edu.vju.lms.wrapper.ClassInfoWrapper;

public interface ClassInfoService extends CrudService<ClassInfoWrapper> {

    ClassInfoWrapper getByName(String name);

    /** All-or-nothing: any unknown, inactive or already-enrolled student rejects the whole list. */
    ClassInfoWrapper enroll(String classId, List<String> studentIds);
}
