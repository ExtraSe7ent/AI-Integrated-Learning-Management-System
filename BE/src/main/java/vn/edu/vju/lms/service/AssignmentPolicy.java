package vn.edu.vju.lms.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import vn.edu.vju.lms.ai.EssayGradingJob;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.entity.Assessment;
import vn.edu.vju.lms.entity.Assignment;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.security.UserPrincipal;

/** Shared policy for HTTP, bootstrap, grading, appeals and AI. Mutations hold the assignment row lock. */
@Component
public class AssignmentPolicy {
    private final IAssessmentDao assessments;
    private final IClassInfoDao classes;
    private final TeachingScope scope;
    private final ApplicationEventPublisher events;
    private final ZoneId zone;
    private static final DateTimeFormatter SUBMITTED = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public AssignmentPolicy(IAssessmentDao assessments, IClassInfoDao classes, TeachingScope scope,
            ApplicationEventPublisher events, LmsProperties properties) {
        this.assessments = assessments;
        this.classes = classes;
        this.scope = scope;
        this.events = events;
        this.zone = ZoneId.of(properties.getTimeZone());
    }

    public boolean canRead(Assignment assignment) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal user)) return true;
        if (user.role() == Role.ADMIN) return true;
        return assignment.getClassId() != null && scope.readableClassIds().contains(assignment.getClassId())
                && (!user.isStudent() || Boolean.TRUE.equals(assignment.getPublished()));
    }

    public void requireRead(Assignment assignment) {
        if (!canRead(assignment)) throw new ForbiddenOperationException("Bạn không được truy cập bài tập của lớp này.");
    }

    public void requireTeaching(Assignment assignment) {
        UserPrincipal user = UserPrincipal.current();
        if (user.role() != Role.ADMIN && user.role() != Role.LECTURER) {
            throw new ForbiddenOperationException("Bạn không có quyền quản lý/chấm bài tập.");
        }
        if (assignment.getClassId() == null) {
            if (user.role() != Role.ADMIN) throw new ForbiddenOperationException("Bài tập cũ chưa được phân loại lớp.");
        } else {
            if(classes.findById(assignment.getClassId()).isEmpty()) throw new BusinessRuleException("Lớp học phần không tồn tại.");
            scope.requireClass(assignment.getClassId());
        }
    }

    public List<String> roster(Assignment assignment) {
        return classes.findById(String.valueOf(assignment.getClassId())).map(c -> List.copyOf(c.getStudentIds())).orElse(List.of());
    }

    public Assessment record(String studentId, Assignment assignment) {
        return assessments.find(studentId, assignment.getId()).orElseGet(() -> {
            Assessment r = new Assessment();r.setId(studentId+":"+assignment.getId());
            r.setStudentId(studentId);r.setAssignmentId(assignment.getId());return assessments.persist(r);
        });
    }

    public void finishOfficial(Assessment record, Assignment assignment, List<String> answers) {
        if (record.getScore() != null) return;
        List<Double> points = AssessmentGrader.grade(AssessmentGrader.questionsOf(assignment), answers);
        record.setAnswers(new ArrayList<>(answers));record.setQuestionPoints(points);
        record.setScore(AssessmentGrader.total(points));record.setAttempts(1);
        record.setSubmitted(timestamp());record.setApproved(null);record.setComment(null);record.setAiFeedback(null);
        record.setDraftAnswers(null);record.setDraftDeadline(null);
        events.publishEvent(new EssayGradingJob.Submitted(record.getStudentId(),record.getAssignmentId()));
    }

    public String timestamp() { return LocalDateTime.now(zone).format(SUBMITTED); }

    public void refresh(Assignment assignment) {
        if (!Boolean.TRUE.equals(assignment.getPublished()) || assignment.getClassId() == null) return;
        if (Boolean.TRUE.equals(assignment.getAnswersReleased())) { closeRoster(assignment); return; }
        for (Assessment r : assessments.findByAssignment(assignment.getId())) {
            if (r.getScore() == null && r.getDraftDeadline() != null && r.getDraftDeadline() <= Instant.now().toEpochMilli()) {
                finishOfficial(r, assignment, r.getDraftAnswers() == null ? List.of() : r.getDraftAnswers());
            }
        }
        List<String> roster = roster(assignment);
        if (!roster.isEmpty() && roster.stream().allMatch(id -> assessments.find(id,assignment.getId())
                .filter(r -> r.getScore()!=null).isPresent())) assignment.setAnswersReleased(true);
    }

    public void release(Assignment assignment) {
        requireTeaching(assignment);
        if (!Boolean.TRUE.equals(assignment.getPublished())) throw new BusinessRuleException("Công bố bài tập trước khi công bố đáp án.");
        assignment.setAnswersReleased(true);
        closeRoster(assignment);
    }

    private void closeRoster(Assignment assignment) {
        for (String id : roster(assignment)) {
            Assessment r=record(id,assignment);
            finishOfficial(r,assignment,r.getDraftAnswers()==null?List.of():r.getDraftAnswers());
        }
    }
}
