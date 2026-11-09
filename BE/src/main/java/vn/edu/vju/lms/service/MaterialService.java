package vn.edu.vju.lms.service;

import java.io.OutputStream;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vju.lms.wrapper.MaterialWrapper;

public interface MaterialService {

    MaterialWrapper upload(String classId, String title, int weekNumber, MultipartFile file);

    MaterialWrapper addVersion(String id, MultipartFile file);

    /** Students only see published materials of classes they are enrolled in. */
    List<MaterialWrapper> listByClass(String classId);

    MaterialWrapper publish(String id);

    MaterialWrapper unpublish(String id);

    MaterialWrapper requestIndex(String id);

    void delete(String id);

    /** Returns the original file name after checking access; the stream is written by writeFile. */
    String fileName(String id);

    void writeFile(String id, OutputStream target);
}
