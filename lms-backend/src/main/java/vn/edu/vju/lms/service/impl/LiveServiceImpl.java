package vn.edu.vju.lms.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.dao.ILiveStateDao;
import vn.edu.vju.lms.entity.LiveState;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.LiveService;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveControl;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveResponse;
import vn.edu.vju.lms.wrapper.LiveWrappers.LiveStateWrapper;

@Service
public class LiveServiceImpl implements LiveService {

    private static final int NO_ANSWER = -1;

    private final ILiveStateDao liveDao;

    public LiveServiceImpl(ILiveStateDao liveDao) {
        this.liveDao = liveDao;
    }

    @Override
    @Transactional
    public LiveStateWrapper state() {
        return toWrapper(current());
    }

    @Override
    @Transactional
    public LiveStateWrapper control(LiveControl control) {
        LiveState live = current();
        if (Boolean.TRUE.equals(control.reset())) {
            live.setAnswers(new HashMap<>());
            live.setRevealed(false);
        }
        if (control.active() != null) {
            if (control.active() && !live.isActive()) {
                live.setParticipants(new ArrayList<>());
            }
            live.setActive(control.active());
        }
        if (control.question() != null) {
            live.setQuestion(control.question());
        }
        if (control.revealed() != null) {
            live.setRevealed(control.revealed());
        }
        if (control.expiresAt() != null) {
            live.setExpiresAt(control.expiresAt());
        }
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
            live.setParticipants(append(live, studentId));
        }
        if (response.answer() != null) {
            if (live.isRevealed() || !live.getParticipants().contains(studentId)) {
                throw new BusinessRuleException("Câu hỏi đã đóng.");
            }
            Map<String, Integer> answers = new HashMap<>(live.getAnswers());
            answers.putIfAbsent(studentId, response.answer());
            live.setAnswers(answers);
        }
        revealIfDue(live);
        return toWrapper(live);
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
        return new LiveStateWrapper(live.isActive(), live.getCode(), live.getQuestion(), live.isRevealed(),
                live.getExpiresAt(), live.getAnswers(), live.getParticipants());
    }
}
