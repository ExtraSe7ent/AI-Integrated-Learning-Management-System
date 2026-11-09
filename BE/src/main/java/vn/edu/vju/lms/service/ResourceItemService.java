package vn.edu.vju.lms.service;

import java.io.OutputStream;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vju.lms.common.service.CrudService;
import vn.edu.vju.lms.wrapper.ResourceItemWrapper;

public interface ResourceItemService extends CrudService<ResourceItemWrapper> {

    ResourceItemWrapper upload(String title, String description, MultipartFile file);

    String fileName(String id);

    void writeFile(String id, OutputStream out);
}
