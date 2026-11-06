package vn.edu.vju.lms.service.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.ai.AiAnswer;
import vn.edu.vju.lms.ai.AiClient;
import vn.edu.vju.lms.ai.AiProviderException;
import vn.edu.vju.lms.ai.GuardrailService;
import vn.edu.vju.lms.ai.LocalTutor;
import vn.edu.vju.lms.ai.QuestionGenerator;
import vn.edu.vju.lms.ai.RagAnswerService;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.config.LmsProperties;
import vn.edu.vju.lms.dao.IChatMessageDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IQuestionDao;
import vn.edu.vju.lms.entity.ChatMessage;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.entity.Question;
import vn.edu.vju.lms.entity.RagChunk;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.ChatService;
import vn.edu.vju.lms.wrapper.ChatWrappers.AskRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.ChatMessageWrapper;
import vn.edu.vju.lms.wrapper.ChatWrappers.GeneratedQuestion;
import vn.edu.vju.lms.wrapper.ChatWrappers.PracticeRequest;
import vn.edu.vju.lms.wrapper.ChatWrappers.PracticeSet;

/** No transaction around ask: model calls can take a minute and must not hold a database connection. */
@Service
public class ChatServiceImpl implements ChatService {

    private static final String DEFAULT_COURSE = "cs301";
    private static final int PRACTICE_SIZE = 3;
    private static final int BLANK_ANSWER_LIMIT = 24;
    private static final String NOT_ENOUGH = "Nội dung học liệu chưa đủ để tạo câu hỏi.";

    private final IChatMessageDao chatDao;
    private final IClassInfoDao classDao;
    private final AiClient client;
    private final GuardrailService guardrails;
    private final RagAnswerService ragAnswers;
    private final LocalTutor localTutor;
    private final QuestionGenerator generator;
    private final IQuestionDao questionDao;
    private final TransactionTemplate transaction;
    private final LmsProperties properties;

    public ChatServiceImpl(IChatMessageDao chatDao, IClassInfoDao classDao, AiClient client, GuardrailService guardrails,
            RagAnswerService ragAnswers, LocalTutor localTutor, QuestionGenerator generator, IQuestionDao questionDao,
            TransactionTemplate transaction, LmsProperties properties) {
        this.chatDao = chatDao;
        this.classDao = classDao;
        this.client = client;
        this.guardrails = guardrails;
        this.ragAnswers = ragAnswers;
        this.localTutor = localTutor;
        this.generator = generator;
        this.questionDao = questionDao;
        this.transaction = transaction;
        this.properties = properties;
    }

    @Override
    public ChatMessageWrapper ask(AskRequest request) {
        UserPrincipal user = UserPrincipal.current();
        checkQuota(user);
        String courseId = StringUtils.hasText(request.courseId()) ? request.courseId() : DEFAULT_COURSE;
        String question = request.question().trim();
        AiAnswer answer = answer(user, courseId, question, request.page());
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

    private AiAnswer answer(UserPrincipal user, String courseId, String question, Integer page) {
        boolean teacher = !user.isStudent();
        List<RagChunk> chunks = ragAnswers.candidates(scope(user, courseId));
        if (client.chatConfigured()) {
            return ragAnswers.answer(question, teacher, chunks, page);
        }
        GuardrailService.Decision decision = guardrails.ruleDecision(question, teacher);
        if (decision != null) {
            boolean hint = "hint".equals(decision.action());
            return AiAnswer.withoutSources(hint ? GuardrailService.HINT : GuardrailService.REFUSAL, "guardrail_" + decision.action());
        }
        return localTutor.answer(courseId, question, chunks, page);
    }

    @Override
    public PracticeSet practice(PracticeRequest request) {
        UserPrincipal user = UserPrincipal.current();
        checkQuota(user);
        List<RagChunk> chunks = chunksInRange(user, request);
        if (client.chatConfigured() && !chunks.isEmpty()) {
            try {
                List<GeneratedQuestion> questions = generator.generate(chunks, PRACTICE_SIZE, request.round(),
                        List.of(ExamQuestion.CHOICE, ExamQuestion.BLANK));
                if (!questions.isEmpty()) {
                    return new PracticeSet("ai", questions);
                }
            } catch (AiProviderException e) {
                return new PracticeSet("bank", fromBank(request));
            }
        }
        return new PracticeSet("bank", fromBank(request));
    }

    @Override
    public List<GeneratedQuestion> suggestQuestions(PracticeRequest request) {
        UserPrincipal user = UserPrincipal.current();
        checkQuota(user);
        if (!client.chatConfigured()) {
            throw new BusinessRuleException("Chưa cấu hình khóa AI nên chưa thể gợi ý câu hỏi.");
        }
        List<RagChunk> chunks = chunksInRange(user, request);
        if (chunks.isEmpty()) {
            throw new BusinessRuleException(NOT_ENOUGH);
        }
        try {
            return generator.generate(chunks, PRACTICE_SIZE, request.round(), List.of(ExamQuestion.CHOICE));
        } catch (AiProviderException e) {
            throw new BusinessRuleException("Trợ lý AI tạm thời không phản hồi. Bạn hãy thử lại sau.");
        }
    }

    private List<RagChunk> chunksInRange(UserPrincipal user, PracticeRequest request) {
        String courseId = StringUtils.hasText(request.courseId()) ? request.courseId() : DEFAULT_COURSE;
        return ragAnswers.candidates(scope(user, courseId)).stream()
                .filter(chunk -> inRange(chunk.getPage(), request)).toList();
    }

    private boolean inRange(Integer page, PracticeRequest request) {
        return page != null && (request.fromPage() == null || page >= request.fromPage())
                && (request.toPage() == null || page <= request.toPage());
    }

    /** Without a model, approved questions rotate each round, alternating choice and fill-in where the answer is short. */
    private List<GeneratedQuestion> fromBank(PracticeRequest request) {
        List<Question> pool = transaction.execute(s -> questionDao.findAll().stream()
                .filter(question -> Boolean.TRUE.equals(question.getApproved()) && inRange(question.getPage(), request)).toList());
        if (pool.isEmpty()) {
            throw new BusinessRuleException(NOT_ENOUGH);
        }
        List<GeneratedQuestion> questions = new ArrayList<>();
        int offset = Math.floorMod(request.round(), pool.size());
        for (int i = 0; i < Math.min(PRACTICE_SIZE, pool.size()); i++) {
            questions.add(asPractice(pool.get((offset + i) % pool.size()), (request.round() + i) % 2 == 1));
        }
        return questions;
    }

    private GeneratedQuestion asPractice(Question question, boolean blank) {
        String answer = question.getOptions().get(question.getCorrect());
        if (blank && answer.length() <= BLANK_ANSWER_LIMIT) {
            return new GeneratedQuestion(question.getId(), ExamQuestion.BLANK, question.getPage(), question.getText(), null,
                    answer, question.getExplanation());
        }
        return new GeneratedQuestion(question.getId(), ExamQuestion.CHOICE, question.getPage(), question.getText(),
                question.getOptions(), answer, question.getExplanation());
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
