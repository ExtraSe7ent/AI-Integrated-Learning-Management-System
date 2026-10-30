package vn.edu.vju.lms.wrapper;

import lombok.Data;

@Data
public class MaterialWrapper {

    private String id;

    private String classId;

    private int weekNumber;

    private String kind;

    private String title;

    private String status;

    private String indexStatus;

    private String indexError;

    private int currentVersion;

    private String originalName;

    private long fileSize;
}
