package vn.edu.vju.lms.ai;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.entity.Assessment;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.service.AssessmentGrader;

/** A model call can take a minute, so essays are graded after the submission is committed, off the request thread. */
@Component
public class EssayGradingJob {

    public record Submitted(String studentId, String assignmentId) {
    }

    private final AiClient client;
    private final EssayGrader grader;
    private final IAssessmentDao assessmentDao;
    private final IAssignmentDao assignmentDao;
    private final TransactionTemplate transaction;

    public EssayGradingJob(AiClient client, EssayGrader grader, IAssessmentDao assessmentDao, IAssignmentDao assignmentDao,
            TransactionTemplate transaction) {
        this.client = client;
        this.grader = grader;
        this.assessmentDao = assessmentDao;
        this.assignmentDao = assignmentDao;
        this.transaction = transaction;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSubmitted(Submitted event) {
        if (client.chatConfigured()) {
            grade(event);
        }
    }

    void grade(Submitted event) {
        record Work(List<ExamQuestion> questions, List<String> answers, int attempts) {
        }
        Work work = transaction.execute(s -> assessmentDao.find(event.studentId(), event.assignmentId())
                .flatMap(record -> assignmentDao.findById(event.assignmentId()).map(assignment ->
                        new Work(AssessmentGrader.questionsOf(assignment), List.copyOf(record.getAnswers()), record.getAttempts())))
                .orElse(null));
        if (work == null) {
            return;
        }
        List<EssayGrader.Draft> drafts = new ArrayList<>();
        for (int i = 0; i < work.questions().size(); i++) {
            if (work.questions().get(i).isEssay()) {
                drafts.add(grader.draft(i, work.questions().get(i), i < work.answers().size() ? work.answers().get(i) : ""));
            }
        }
        transaction.executeWithoutResult(s -> assessmentDao.find(event.studentId(), event.assignmentId())
                .filter(record -> record.getAttempts() == work.attempts() && !Boolean.TRUE.equals(record.getApproved()))
                .ifPresent(record -> apply(record, drafts, work.questions().size())));
    }

    private void apply(Assessment record, List<EssayGrader.Draft> drafts, int size) {
        List<Double> points = new ArrayList<>(record.getQuestionPoints());
        List<String> feedback = new ArrayList<>(Collections.nCopies(size, ""));
        drafts.forEach(draft -> {
            points.set(draft.questionIndex(), draft.points());
            feedback.set(draft.questionIndex(), draft.feedback());
        });
        record.setQuestionPoints(points);
        record.setAiFeedback(feedback);
        record.setScore(AssessmentGrader.total(points));
    }
}
