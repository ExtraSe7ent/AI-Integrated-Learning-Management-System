package vn.edu.vju.lms.service.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.ai.AiAnswer;
import vn.edu.vju.lms.ai.AiClient;
import vn.edu.vju.lms.ai.GuardrailService;
import vn.edu.vju.lms.ai.LocalTutor;
import vn.edu.vju.lms.ai.RagAnswerService;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IChatMessageDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.entity.ChatMessage;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.RagChunk;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.ChatService;
import vn.edu.vju.lms.wrapper.ChatWrappers.AskRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.ChatMessageWrapper;

/** No transaction around ask: model calls can take a minute and must not hold a database connection. */
@Service
public class ChatServiceImpl implements ChatService {

    private static final String DEFAULT_COURSE = "cs301";

    private final IChatMessageDao chatDao;
    private final IClassInfoDao classDao;
    private final AiClient client;
    private final GuardrailService guardrails;
    private final RagAnswerService ragAnswers;
    private final LocalTutor localTutor;
    private final TransactionTemplate transaction;
    private final LmsProperties properties;

    public ChatServiceImpl(IChatMessageDao chatDao, IClassInfoDao classDao, AiClient client, GuardrailService guardrails,
            RagAnswerService ragAnswers, LocalTutor localTutor, TransactionTemplate transaction, LmsProperties properties) {
        this.chatDao = chatDao;
        this.classDao = classDao;
        this.client = client;
        this.guardrails = guardrails;
        this.ragAnswers = ragAnswers;
        this.localTutor = localTutor;
        this.transaction = transaction;
        this.properties = properties;
    }

    @Override
    public ChatMessageWrapper ask(AskRequest request) {
        UserPrincipal user = UserPrincipal.current();
        checkQuota(user);
        String courseId = StringUtils.hasText(request.courseId()) ? request.courseId() : DEFAULT_COURSE;
        String question = request.question().trim();
        AiAnswer answer = answer(user, courseId, question);
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID().toString());
        message.setOwnerId(user.id());
        message.setCourseId(courseId);
        message.setQuestion(question);
        message.setAnswer(answer.answer());
        message.setPage(answer.page());
        message.setSources(answer.sources());
        message.setMode(answer.mode());
        transaction.executeWithoutResult(s -> chatDao.persist(message));
        return toWrapper(message);
    }

    private AiAnswer answer(UserPrincipal user, String courseId, String question) {
        boolean teacher = !user.isStudent();
        List<RagChunk> chunks = ragAnswers.candidates(scope(user, courseId));
        if (client.chatConfigured()) {
            return ragAnswers.answer(question, teacher, chunks);
        }
        GuardrailService.Decision decision = guardrails.ruleDecision(question, teacher);
        if (decision != null) {
            boolean hint = "hint".equals(decision.action());
            return AiAnswer.withoutSources(hint ? GuardrailService.HINT : GuardrailService.REFUSAL, "guardrail_" + decision.action());
        }
        return localTutor.answer(courseId, question, chunks);
    }

    /** Students only search classes they are enrolled in; staff search every class of the course. */
    private List<String> scope(UserPrincipal user, String courseId) {
        return transaction.execute(s -> classDao.findByCourse(courseId).stream()
                .filter(info -> !user.isStudent() || info.getStudentIds().contains(user.id()))
                .map(ClassInfo::getId).toList());
    }

    private void checkQuota(UserPrincipal user) {
        ZoneId zone = ZoneId.of(properties.getTimeZone());
        Instant startOfDay = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        int limit = user.isStudent() ? properties.getAi().getDailyLimitStudent() : properties.getAi().getDailyLimitTeacher();
        if (chatDao.countSince(user.id(), startOfDay) >= limit) {
            throw new BusinessRuleException("Bạn đã dùng hết lượt hỏi AI hôm nay.");
        }
    }

    @Override
    public List<ChatMessageWrapper> mine() {
        return chatDao.findByOwner(UserPrincipal.current().id()).stream().map(this::toWrapper).toList();
    }

    @Override
    public ChatMessageWrapper rate(String id, String rating) {
        if (!List.of("helpful", "reported").contains(String.valueOf(rating))) {
            throw new BusinessRuleException("Đánh giá không hợp lệ.");
        }
        String owner = UserPrincipal.current().id();
        return transaction.execute(s -> {
            ChatMessage message = chatDao.findById(id).filter(m -> owner.equals(m.getOwnerId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời."));
            message.setRating(rating);
            return toWrapper(message);
        });
    }

    private ChatMessageWrapper toWrapper(ChatMessage message) {
        return new ChatMessageWrapper(message.getId(), message.getQuestion(), message.getAnswer(), message.getPage(),
                message.getCourseId(), message.getSources(), message.getRating());
    }
}
