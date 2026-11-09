package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;

/** Cross-account outcomes of the class scope, answer release and first-attempt-only contract. */
class AssignmentLifecycleSecurityRestTest extends AbstractApiTest {
    private String classId;
    private String otherClassId;
    private String assignmentId;
    private String otherLecturer;

    @BeforeEach
    void scopedAssignment() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        classId = "life-class-" + suffix;
        otherClassId = "life-other-class-" + suffix;
        assignmentId = "life-exam-" + suffix;
        otherLecturer = "GV-life-" + suffix;
        account(otherLecturer, Role.LECTURER, "teacher");
        tx.executeWithoutResult(s -> {
            classDao.persist(classInfo(classId, LECTURER, List.of(STUDENT, OTHER_STUDENT)));
            classDao.persist(classInfo(otherClassId, otherLecturer, List.of()));
        });
        mvc.perform(post("/api/assignments").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("id", assignmentId, "classId", classId, "title", "Scoped first attempt",
                        "minutes", 10, "attempts", 3, "opens", "2020-01-01T00:00",
                        "closes", "2099-01-01T00:00", "published", true, "questions", questions()))))
                .andExpect(status().isCreated());
    }

    private ClassInfo classInfo(String id, String teacher, List<String> students) {
        ClassInfo info = new ClassInfo();
        info.setId(id);
        info.setCourseId("cs301");
        info.setName(id);
        info.setTerm("I");
        info.setYear("2026-2027");
        info.setRound("1");
        info.setTeacherId(teacher);
        info.setStudentIds(new ArrayList<>(students));
        return info;
    }

    private void account(String id, Role role, String kind) {
        UserAccount user = new UserAccount();
        user.setId(id);
        user.setName("Lifecycle " + id);
        user.setEmail(id.toLowerCase() + "@example.test");
        user.setEmailHash(aesService.blindIndex(user.getEmail()));
        user.setKind(kind);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        tx.executeWithoutResult(s -> userDao.persist(user));
    }

    private List<Map<String, Object>> questions() {
        return List.of(Map.of("type", "choice", "text", "Which answer is correct?",
                "options", List.of("Wrong", "Right"), "correct", "1",
                "explanation", "Protected explanation", "points", 10));
    }

    private void begin(String student, String answer) throws Exception {
        mvc.perform(put("/api/assessments/" + assignmentId).headers(auth(student)).contentType(JSON)
                .content(json(Map.of("draft", Map.of("answers", List.of(answer))))))
                .andExpect(status().isOk());
    }

    private void submit(String student, String answer) throws Exception {
        mvc.perform(put("/api/assessments/" + assignmentId).headers(auth(student)).contentType(JSON)
                .content(json(Map.of("result", Map.of("answers", List.of(answer))))))
                .andExpect(status().isOk());
    }

    private void firstAttempt(String student, String answer) throws Exception {
        begin(student, answer);
        submit(student, answer);
    }

    private void release(String caller) throws Exception {
        mvc.perform(post("/api/assignments/" + assignmentId + "/answer-release").headers(auth(caller)))
                .andExpect(status().isOk());
    }

    @Test
    void outsideStudentCannotGetFindOrStartAssignment() throws Exception {
        tx.executeWithoutResult(s -> classDao.findById(classId).orElseThrow().getStudentIds().remove(OTHER_STUDENT));
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(OTHER_STUDENT)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/assignments").headers(auth(OTHER_STUDENT)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[*].id", not(hasItem(assignmentId))));
        mvc.perform(get("/api/assignments/search").param("search", "id:" + assignmentId).headers(auth(OTHER_STUDENT)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(put("/api/assessments/" + assignmentId).headers(auth(OTHER_STUDENT)).contentType(JSON)
                .content(json(Map.of("draft", Map.of("answers", List.of("1"))))))
                .andExpect(status().isForbidden());
    }

    @Test
    void newAssignmentRequiresExplicitClassOwnership() throws Exception {
        mvc.perform(post("/api/assignments").headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("title", "No class", "minutes", 10, "attempts", 1,
                        "opens", "2020-01-01T00:00", "closes", "2099-01-01T00:00", "questions", questions()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void firstSubmissionDoesNotReleaseAnswersAndCannotStartSecondOfficialAttempt() throws Exception {
        firstAttempt(STUDENT, "0");
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(STUDENT)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.answersReleased").value(false))
                .andExpect(jsonPath("$.questions[0].correct").doesNotExist())
                .andExpect(jsonPath("$.questions[0].explanation").doesNotExist());
        mvc.perform(get("/api/assessments").headers(auth(STUDENT)))
                .andExpect(jsonPath("$['" + assignmentId + "'].result.questionPoints").doesNotExist())
                .andExpect(jsonPath("$['" + assignmentId + "'].result.aiFeedback").doesNotExist());
        mvc.perform(put("/api/assessments/" + assignmentId).headers(auth(STUDENT)).contentType(JSON)
                .content(json(Map.of("draft", Map.of("answers", List.of("1"))))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void allCurrentStudentsSubmittingReleasesAnswersAndPracticeNeverChangesOfficialScore() throws Exception {
        firstAttempt(STUDENT, "0");
        firstAttempt(OTHER_STUDENT, "1");
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.answersReleased").value(true))
                .andExpect(jsonPath("$.questions[0].correct").value("1"));
        begin(STUDENT, "1");
        submit(STUDENT, "1");
        mvc.perform(get("/api/assessments").headers(auth(STUDENT)))
                .andExpect(jsonPath("$['" + assignmentId + "'].attempts").value(1))
                .andExpect(jsonPath("$['" + assignmentId + "'].result.score").value(0.0))
                .andExpect(jsonPath("$['" + assignmentId + "'].result.answers[0]").value("0"))
                .andExpect(jsonPath("$['" + assignmentId + "'].practiceResults[0].score").value(10.0))
                .andExpect(jsonPath("$['" + assignmentId + "'].practiceResults[0].answers[0]").value("1"));
    }

    @Test
    void explicitReleaseClosesUnstartedStudentsWithZeroAndIsIdempotent() throws Exception {
        release(LECTURER);
        release(LECTURER);
        for (String student : List.of(STUDENT, OTHER_STUDENT)) {
            mvc.perform(get("/api/assessments").headers(auth(student)))
                    .andExpect(jsonPath("$['" + assignmentId + "'].attempts").value(1))
                    .andExpect(jsonPath("$['" + assignmentId + "'].draft").isEmpty())
                    .andExpect(jsonPath("$['" + assignmentId + "'].result.score").value(0.0));
        }
    }

    @Test
    void explicitReleaseUsesLastSavedAnswersAndLateRequestCannotReplaceThem() throws Exception {
        begin(STUDENT, "0");
        release(LECTURER);
        submit(STUDENT, "1");
        mvc.perform(get("/api/assessments").headers(auth(STUDENT)))
                .andExpect(jsonPath("$['" + assignmentId + "'].result.answers[0]").value("0"))
                .andExpect(jsonPath("$['" + assignmentId + "'].result.score").value(0.0))
                .andExpect(jsonPath("$['" + assignmentId + "'].attempts").value(1));
    }

    @Test
    void studentsAddedBeforeReleaseParticipateInAutomaticReleaseCondition() throws Exception {
        String added = "SV-life-" + UUID.randomUUID().toString().substring(0, 8);
        account(added, Role.STUDENT, "student");
        tx.executeWithoutResult(s -> classDao.findById(classId).orElseThrow().getStudentIds().add(added));
        firstAttempt(STUDENT, "0");
        firstAttempt(OTHER_STUDENT, "1");
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.answersReleased").value(false));
        firstAttempt(added, "1");
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.answersReleased").value(true));
    }

    @Test
    void forgedReleaseFlagDoesNotOpenAnswersOrPractice() throws Exception {
        int code = mvc.perform(put("/api/assignments/" + assignmentId).headers(auth(LECTURER)).contentType(JSON)
                .content("{\"answersReleased\":true}"))
                .andReturn().getResponse().getStatus();
        assertThat(code).isIn(200, 400);
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(STUDENT)))
                .andExpect(jsonPath("$.answersReleased").value(false))
                .andExpect(jsonPath("$.questions[0].correct").doesNotExist());
    }

    @Test
    void otherLecturerCannotReadGradeGetAiDraftsReleaseOrMoveAnotherClassesAssignment() throws Exception {
        firstAttempt(STUDENT, "0");
        mvc.perform(get("/api/assignments/" + assignmentId).headers(auth(otherLecturer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/assessments/" + assignmentId + "/submissions").headers(auth(otherLecturer)))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/assessments/" + assignmentId).headers(auth(otherLecturer)).contentType(JSON)
                .content(json(Map.of("studentId", STUDENT, "result", Map.of("questionPoints", List.of(10), "approved", true)))))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/assessments/" + assignmentId + "/essay-drafts").param("studentId", STUDENT)
                .headers(auth(otherLecturer))).andExpect(status().isForbidden());
        mvc.perform(post("/api/assignments/" + assignmentId + "/answer-release").headers(auth(otherLecturer)))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/assignments/" + assignmentId).headers(auth(otherLecturer)).contentType(JSON)
                .content(json(Map.of("classId", otherClassId))))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownLecturerCannotMoveAssignmentIntoUnassignedClass() throws Exception {
        mvc.perform(put("/api/assignments/" + assignmentId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("classId", otherClassId))))
                .andExpect(status().isForbidden());
    }

    @Test
    void examQuestionAndTimeConfigurationLockWhenFirstStudentStarts() throws Exception {
        begin(STUDENT, "0");
        mvc.perform(put("/api/assignments/" + assignmentId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("minutes", 60))))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/assignments/" + assignmentId).headers(auth(LECTURER)).contentType(JSON)
                .content(json(Map.of("questions", List.of(Map.of("type", "choice", "text", "Changed question",
                        "options", List.of("Wrong", "Right"), "correct", "1", "points", 10))))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void studentCannotInvokeTeacherReleaseEndpoint() throws Exception {
        mvc.perform(post("/api/assignments/" + assignmentId + "/answer-release").headers(auth(STUDENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void practiceCannotChangeClassAverageAndAppealsAreScopedToTheAssignment() throws Exception {
        firstAttempt(STUDENT,"0");firstAttempt(OTHER_STUDENT,"1");
        begin(STUDENT,"1");submit(STUDENT,"1");
        mvc.perform(get("/api/analytics").headers(auth(LECTURER)))
            .andExpect(jsonPath("$.classes[?(@.id=='"+classId+"')].students[?(@.id=='"+STUDENT+"')].average").value(0.0));
        String appeal=assignmentId+"-appeal";
        mvc.perform(post("/api/appeals").headers(auth(STUDENT)).contentType(JSON)
            .content(json(Map.of("id",appeal,"assignmentId",assignmentId,"reason","Xin xem lại","questionIndex",0))))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/appeals/"+appeal).headers(auth(otherLecturer))).andExpect(status().isForbidden());
        mvc.perform(put("/api/appeals/"+appeal).headers(auth(otherLecturer)).contentType(JSON)
            .content(json(Map.of("status","rejected","response","Không")))).andExpect(status().isForbidden());
    }

    @Test
    void mistakeExplanationCannotRevealKeysBeforeRelease() throws Exception {
        firstAttempt(STUDENT,"0");
        mvc.perform(post("/api/ai/mistake-explanation").headers(auth(STUDENT)).contentType(JSON)
            .content(json(Map.of("assignmentId",assignmentId,"questionIndex",0))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void retriesAndConcurrentSubmissionsCannotReplaceFirstScore() throws Exception {
        begin(STUDENT,"0");
        var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            var gate=new java.util.concurrent.CountDownLatch(1);
            var futures=new ArrayList<java.util.concurrent.Future<Integer>>();
            for(String answer:List.of("0","1")) futures.add(pool.submit(()->{
                gate.await();
                var response=mvc.perform(put("/api/assessments/"+assignmentId).headers(auth(STUDENT)).contentType(JSON)
                    .content(json(Map.of("result",Map.of("answers",List.of(answer)))))).andReturn().getResponse();
                assertThat(response.getStatus()).isEqualTo(200);
                return mapper.readTree(response.getContentAsString()).path("result").path("score").asInt();
            }));
            gate.countDown();
            int first=futures.get(0).get(15,java.util.concurrent.TimeUnit.SECONDS);
            assertThat(futures.get(1).get(15,java.util.concurrent.TimeUnit.SECONDS)).isEqualTo(first);
            mvc.perform(get("/api/assessments").headers(auth(STUDENT))).andExpect(jsonPath("$['"+assignmentId+"'].attempts").value(1));
        } finally {pool.shutdownNow();}
    }

    @Test
    void practiceSubmitRetryIsIdempotentAndRemovedStudentLosesAccess() throws Exception {
        firstAttempt(STUDENT,"0");firstAttempt(OTHER_STUDENT,"1");begin(STUDENT,"1");submit(STUDENT,"1");submit(STUDENT,"0");
        mvc.perform(get("/api/assessments").headers(auth(STUDENT)))
            .andExpect(jsonPath("$['"+assignmentId+"'].practiceResults.length()").value(1))
            .andExpect(jsonPath("$['"+assignmentId+"'].result.score").value(0.0));
        tx.executeWithoutResult(t->classDao.findById(classId).orElseThrow().getStudentIds().remove(STUDENT));
        mvc.perform(get("/api/assignments/"+assignmentId).headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/assessments").headers(auth(STUDENT))).andExpect(jsonPath("$['"+assignmentId+"']").doesNotExist());
    }

    @Test
    void releaseStaysFinalWhenRosterChangesAndNewStudentGetsZeroOfficialScore() throws Exception {
        firstAttempt(STUDENT,"0");
        tx.executeWithoutResult(t->classDao.findById(classId).orElseThrow().getStudentIds().remove(OTHER_STUDENT));
        mvc.perform(get("/api/assignments/"+assignmentId).headers(auth(STUDENT))).andExpect(jsonPath("$.answersReleased").value(true));
        String added="SV-new-"+UUID.randomUUID().toString().substring(0,8);account(added,Role.STUDENT,"student");
        tx.executeWithoutResult(t->classDao.findById(classId).orElseThrow().getStudentIds().add(added));
        mvc.perform(get("/api/assignments/"+assignmentId).headers(auth(added))).andExpect(jsonPath("$.answersReleased").value(true));
        mvc.perform(get("/api/assessments").headers(auth(added))).andExpect(jsonPath("$['"+assignmentId+"'].result.score").value(0.0));
        begin(added,"1");submit(added,"1");
        mvc.perform(get("/api/assessments").headers(auth(added)))
            .andExpect(jsonPath("$['"+assignmentId+"'].result.score").value(0.0))
            .andExpect(jsonPath("$['"+assignmentId+"'].practiceResults[0].score").value(10.0));
    }

    @Test
    void allExamConfigurationFieldsLockAfterStartAndReleaseCannotBeUndone() throws Exception {
        begin(STUDENT,"0");
        for(var patch:List.of(Map.of("classId",otherClassId),Map.of("opens","2021-01-01T00:00"),Map.of("closes","2098-01-01T00:00"),Map.of("published",false),Map.of("random",true))) {
            mvc.perform(put("/api/assignments/"+assignmentId).headers(auth(LECTURER)).contentType(JSON).content(json(patch)))
                .andExpect(status().isBadRequest());
        }
        release(LECTURER);
        mvc.perform(put("/api/assignments/"+assignmentId).headers(auth(LECTURER)).contentType(JSON).content("{\"answersReleased\":false}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.answersReleased").value(true));
    }

    @org.springframework.beans.factory.annotation.Autowired
    private vn.edu.vju.lms.dao.IAssignmentDao assignmentDao;

    @Test
    void legacyAssignmentWithoutClassIsQuarantinedUntilAdminExplicitlyAssignsIt() throws Exception {
        String legacy=assignmentId+"-old";
        tx.executeWithoutResult(t->{var a=new vn.edu.vju.lms.entity.Assignment();a.setId(legacy);a.setTitle("Legacy");a.setMinutes(10);a.setOpens("2020-01-01T00:00");a.setCloses("2099-01-01T00:00");a.setPublished(true);assignmentDao.persist(a);});
        mvc.perform(get("/api/assignments/"+legacy).headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get("/api/assignments/"+legacy).headers(auth(LECTURER))).andExpect(status().isForbidden());
        mvc.perform(get("/api/assignments/"+legacy).headers(auth(ADMIN))).andExpect(status().isOk());
        mvc.perform(put("/api/assignments/"+legacy).headers(auth(ADMIN)).contentType(JSON).content(json(Map.of("classId",classId))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.classId").value(classId));
        mvc.perform(get("/api/assignments/"+legacy).headers(auth(STUDENT))).andExpect(status().isOk());
    }

    @Test
    void invalidWindowsDurationsAndUnknownClassAreRejectedAndDraftAnswersCannotBeReleased() throws Exception {
        for(var patch:List.of(Map.of("minutes",0),Map.of("minutes",1441),Map.of("opens","not-a-date"),Map.of("closes","2010-01-01T00:00"),Map.of("classId","missing-class"))) {
            mvc.perform(put("/api/assignments/"+assignmentId).headers(auth(ADMIN)).contentType(JSON).content(json(patch)))
                .andExpect(status().isBadRequest());
        }
        mvc.perform(put("/api/assignments/"+assignmentId).headers(auth(LECTURER)).contentType(JSON).content("{\"published\":false}"))
            .andExpect(status().isOk());
        mvc.perform(post("/api/assignments/"+assignmentId+"/answer-release").headers(auth(LECTURER))).andExpect(status().isBadRequest());
    }
}
