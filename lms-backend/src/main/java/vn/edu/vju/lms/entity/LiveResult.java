package vn.edu.vju.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import vn.edu.vju.lms.common.jpa.JsonConverters;

/**
 * The record of one question asked in class (UC-C03), kept after the lecturer moves on or ends the session.
 * The question text and options are copied so the record still reads right if the question is edited later.
 */
@Entity
@Table(name = "live_results")
@Getter
@Setter
public class LiveResult {

    /** Session run id and question number, so each question of each run has one row. */
    @Id
    @Column(length = 120)
    private String id;

    @Column(length = 64)
    private String runId;

    @Column(length = 100)
    private String classId;

    @Column(length = 100)
    private String teacherId;

    @Column(length = 100)
    private String questionId;

    @Column(columnDefinition = "TEXT")
    private String questionText;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> options = new ArrayList<>();

    private Integer correct;

    /** Student id to chosen option; -1 means time ran out without an answer. */
    @Convert(converter = JsonConverters.IntegerMap.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Integer> answers = new HashMap<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "TEXT")
    private List<String> participants = new ArrayList<>();

    private long askedAt;
}
