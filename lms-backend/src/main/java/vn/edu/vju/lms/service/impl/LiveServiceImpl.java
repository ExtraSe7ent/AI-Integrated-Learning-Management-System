package vn.edu.vju.lms.service.impl;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ForbiddenOperationException;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.ILiveResultDao;
import vn.edu.vju.lms.dao.ILiveStateDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.LiveResult;
import vn.edu.vju.lms.entity.LiveState;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.TeachingScope;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.LiveService;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveControl;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveQuestion;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResponse;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResultWrapper;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStudentAnswer;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStateWrapper;

/**
 * UC-C01–C03. The lecturer opens a session for one of their classes and one approved question; each start gets
 * a new six-digit code. The code, every answer and the key stay on the server until the question is revealed.
 */
@Service
public class LiveServiceImpl implements LiveService {

    private static final int NO_ANSWER = -1;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ILiveStateDao liveDao;
    private final IQuestionDao questionDao;
    private final IClassInfoDao classDao;
    private final TeachingScope scope;
    private final ILiveResultDao resultDao;
    private final IUserAccountDao userDao;

    public LiveServiceImpl(ILiveStateDao liveDao, IQuestionDao questionDao, IClassInfoDao classDao, TeachingScope scope,
            ILiveResultDao resultDao, IUserAccountDao userDao) {
        this.liveDao = liveDao;
        this.questionDao = questionDao;
        this.classDao = classDao;
        this.scope = scope;
        this.resultDao = resultDao;
        this.userDao = userDao;
    }

    @Override
    @Transactional
    public LiveStateWrapper state() {
        LiveState live = current();
        record(live);
        return toWrapper(live);
    }

    @Override
    @Transactional
    public LiveStateWrapper control(LiveControl control) {
        LiveState live = current();
        boolean starting = Boolean.TRUE.equals(control.active()) && !live.isActive();
        String classId = control.classId() != null ? control.classId() : live.getClassId();
        if (starting || live.isActive()) {
            if (StringUtils.hasText(classId)) {
                scope.requireClass(classId);
            } else if (starting) {
                throw new BusinessRuleException("Chọn lớp học phần cho phiên hỏi trên lớp.");
            }
        }
        if (starting) {
            live.setCode(String.format("%06d", RANDOM.nextInt(1_000_000)));
            live.setRunId(UUID.randomUUID().toString());
            live.setClassId(classId);
            live.setParticipants(new ArrayList<>());
            live.setAnswers(new HashMap<>());
            live.setRevealed(false);
            if (control.questionId() == null && live.getQuestionId() == null) {
                throw new BusinessRuleException("Chọn câu hỏi đã duyệt để chiếu.");
            }
        }
        if (control.questionId() != null && !control.questionId().equals(live.getQuestionId())) {
            requireQuestion(control.questionId());
            live.setQuestionId(control.questionId());
            live.setQuestion(live.getQuestion() + 1);
            live.setAnswers(new HashMap<>());
            live.setRevealed(false);
        }
        if (Boolean.TRUE.equals(control.reset())) {
            live.setAnswers(new HashMap<>());
            live.setRevealed(false);
        }
        if (control.active() != null) {
            live.setActive(control.active());
        }
        if (control.question() != null && control.questionId() == null) {
            live.setQuestion(control.question());
        }
        if (control.revealed() != null) {
            live.setRevealed(control.revealed());
        }
        if (control.expiresAt() != null) {
            live.setExpiresAt(control.expiresAt());
        }
        record(live);
        return toWrapper(live);
    }

    @Override
    @Transactional
    public LiveStateWrapper respond(LiveResponse response) {
        LiveState live = current();
        if (!live.isActive()) {
            throw new BusinessRuleException("Phiên chưa mở.");
        }
        String studentId = UserPrincipal.current().id();
        if (response.join() && !live.getParticipants().contains(studentId)) {
            if (!live.getCode().equals(response.code())) {
                throw new BusinessRuleException("Mã phiên không đúng hoặc đã hết hạn. Hãy kiểm tra lại với giảng viên.");
            }
            boolean enrolled = !StringUtils.hasText(live.getClassId()) || classDao.findById(live.getClassId())
                    .map(info -> info.getStudentIds().contains(studentId)).orElse(false);
            if (!enrolled) {
                throw new ForbiddenOperationException("Phiên này dành cho lớp " + live.getClassId() + ".");
            }
            live.setParticipants(append(live, studentId));
        }
        if (response.answer() != null) {
            if (live.isRevealed() || !live.getParticipants().contains(studentId)
                    || (live.getExpiresAt() > 0 && System.currentTimeMillis() >= live.getExpiresAt())) {
                throw new BusinessRuleException("Câu hỏi đã đóng.");
            }
            Map<String, Integer> answers = new HashMap<>(live.getAnswers());
            answers.putIfAbsent(studentId, response.answer());
            live.setAnswers(answers);
        }
        revealIfDue(live);
        record(live);
        return toWrapper(live);
    }

    /** Keeps the current question's result once someone has joined, so it survives the next question and the end. */
    private void record(LiveState live) {
        if (live.getRunId() == null || live.getQuestionId() == null || live.getParticipants().isEmpty()) {
            return;
        }
        Question question = questionDao.findById(live.getQuestionId()).orElse(null);
        if (question == null) {
            return;
        }
        String id = live.getRunId() + ":" + live.getQuestion();
        LiveResult result = resultDao.findById(id).orElseGet(() -> {
            LiveResult created = new LiveResult();
            created.setId(id);
            created.setRunId(live.getRunId());
            created.setAskedAt(System.currentTimeMillis());
            return resultDao.persist(created);
        });
        if (!UserPrincipal.callerIsStudent()) {
            result.setTeacherId(UserPrincipal.current().id());
        }
        result.setClassId(live.getClassId());
        result.setQuestionId(question.getId());
        result.setQuestionText(question.getText());
        result.setOptions(new ArrayList<>(question.getOptions()));
        result.setCorrect(question.getCorrect());
        result.setAnswers(new HashMap<>(live.getAnswers()));
        result.setParticipants(new ArrayList<>(live.getParticipants()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiveResultWrapper> results(String classId) {
        UserPrincipal user = UserPrincipal.current();
        if (StringUtils.hasText(classId)) {
            scope.requireClass(classId);
        }
        return resultDao.findAll().stream()
                .filter(r -> !StringUtils.hasText(classId) || classId.equals(r.getClassId()))
                .filter(r -> visible(r, user))
                .sorted(Comparator.comparingLong(LiveResult::getAskedAt).reversed())
                .map(this::toResult).toList();
    }

    private boolean visible(LiveResult result, UserPrincipal user) {
        if (user.role() == Role.ADMIN || user.role() == Role.DEAN) {
            return true;
        }
        ClassInfo info = result.getClassId() == null ? null : classDao.findById(result.getClassId()).orElse(null);
        if (info == null) {
            return user.id().equals(result.getTeacherId());
        }
        return user.id().equals(info.getTeacherId()) || user.id().equals(info.getLeaderId());
    }

    private LiveResultWrapper toResult(LiveResult result) {
        Map<String, Integer> answers = result.getAnswers();
        List<Integer> distribution = new ArrayList<>();
        for (int i = 0; i < result.getOptions().size(); i++) {
            final int option = i;
            distribution.add((int) answers.values().stream().filter(v -> v == option).count());
        }
        Integer key = result.getCorrect();
        List<LiveStudentAnswer> students = result.getParticipants().stream().map(id -> {
            int answer = answers.getOrDefault(id, NO_ANSWER);
            String name = userDao.findById(id).map(UserAccount::getName).orElse(id);
            return new LiveStudentAnswer(id, name, answer, key != null && answer == key);
        }).toList();
        int answered = (int) answers.values().stream().filter(v -> v >= 0).count();
        int correctCount = (int) students.stream().filter(LiveStudentAnswer::correct).count();
        return new LiveResultWrapper(result.getId(), result.getRunId(), result.getClassId(), result.getQuestionId(),
                result.getQuestionText(), result.getOptions(), key, result.getAskedAt(),
                result.getParticipants().size(), answered, correctCount, distribution, students);
    }

    private Question requireQuestion(String id) {
        return questionDao.findById(id).filter(q -> Boolean.TRUE.equals(q.getApproved()))
                .orElseThrow(() -> new BusinessRuleException("Chỉ chiếu được câu hỏi đã duyệt."));
    }

    private ArrayList<String> append(LiveState live, String studentId) {
        ArrayList<String> participants = new ArrayList<>(live.getParticipants());
        participants.add(studentId);
        return participants;
    }

    private LiveState current() {
        LiveState live = liveDao.findById(LiveState.SINGLETON_ID).orElseGet(() -> liveDao.persist(new LiveState()));
        revealIfDue(live);
        return live;
    }

    /** AF-3 of UC-C02: when time is up, a participant who did not answer is recorded as "không trả lời". */
    private void revealIfDue(LiveState live) {
        if (!live.isActive() || live.isRevealed() || live.getExpiresAt() == 0) {
            return;
        }
        boolean expired = System.currentTimeMillis() >= live.getExpiresAt();
        boolean allAnswered = !live.getParticipants().isEmpty()
                && live.getParticipants().stream().allMatch(live.getAnswers()::containsKey);
        if (expired) {
            Map<String, Integer> answers = new HashMap<>();
            live.getParticipants().forEach(id -> answers.put(id, live.getAnswers().getOrDefault(id, NO_ANSWER)));
            live.setAnswers(answers);
        }
        live.setRevealed(expired || allAnswered);
    }

    private LiveStateWrapper toWrapper(LiveState live) {
        boolean student = UserPrincipal.callerIsStudent();
        Question question = live.getQuestionId() == null ? null : questionDao.findById(live.getQuestionId()).orElse(null);
        LiveQuestion current = question == null ? null : new LiveQuestion(question.getId(), question.getText(), question.getOptions());
        boolean showKey = live.isRevealed() || !student;
        List<Integer> distribution = new ArrayList<>();
        if (question != null && showKey) {
            for (int i = 0; i < question.getOptions().size(); i++) {
                final int option = i;
                distribution.add((int) live.getAnswers().values().stream().filter(v -> v == option).count());
            }
        }
        int answered = (int) live.getAnswers().values().stream().filter(v -> v >= 0).count();
        Map<String, Integer> answers = live.getAnswers();
        List<String> participants = live.getParticipants();
        if (student) {
            String me = UserPrincipal.current().id();
            answers = live.getAnswers().containsKey(me) ? Map.of(me, live.getAnswers().get(me)) : Map.of();
            participants = live.getParticipants().contains(me) ? List.of(me) : Collections.emptyList();
        }
        return new LiveStateWrapper(live.isActive(), student ? null : live.getCode(), live.getQuestion(), live.isRevealed(),
                live.getExpiresAt(), answers, participants, live.getClassId(), live.getQuestionId(), current,
                showKey && question != null ? question.getCorrect() : null,
                showKey && question != null ? question.getExplanation() : null, distribution, answered);
    }
}
