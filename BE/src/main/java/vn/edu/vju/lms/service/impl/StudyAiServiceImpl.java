package vn.edu.vju.lms.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.ai.AiClient;
import vn.edu.vju.lms.ai.AiProviderException;
import vn.edu.vju.lms.ai.ClassInsightsGenerator;
import vn.edu.vju.lms.ai.LessonExplainer;
import vn.edu.vju.lms.ai.MistakeCoach;
import vn.edu.vju.lms.ai.RagAlgorithms;
import vn.edu.vju.lms.ai.RagAnswerService;
import vn.edu.vju.lms.ai.StudyAidGenerator;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.common.exception.ResourceNotFoundException;
import vn.edu.vju.lms.dao.IAssessmentDao;
import vn.edu.vju.lms.dao.IAssignmentDao;
import vn.edu.vju.lms.dao.ICardReviewDao;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IKnowledgeGapDao;
import vn.edu.vju.lms.dao.ILearningAidDao;
import vn.edu.vju.lms.dao.ILessonExplanationDao;
import vn.edu.vju.lms.dao.IMistakeExplanationDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.Assessment;
import vn.edu.vju.lms.entity.CardReview;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.ExamQuestion;
import vn.edu.vju.lms.entity.KnowledgeGap;
import vn.edu.vju.lms.entity.LearningAid;
import vn.edu.vju.lms.entity.LessonExplanation;
import vn.edu.vju.lms.entity.MistakeExplanation;
import vn.edu.vju.lms.entity.RagChunk;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;
import vn.edu.vju.lms.security.UserPrincipal;
import vn.edu.vju.lms.service.AnalyticsService;
import vn.edu.vju.lms.service.AssessmentGrader;
import vn.edu.vju.lms.service.StudyAiService;
import vn.edu.vju.lms.wrapper.AnalyticsWrappers.PageReport;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Aid;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidCreate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidGenerateRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.AidUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplainRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Explanation;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ExplanationUpdate;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.Insights;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeExplanationWrapper;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.MistakeRequest;
import vn.edu.vju.lms.wrapper.StudyAiWrappers.ReviewState;

/** Model calls run outside transactions: they can take a minute and must not hold a database connection. */
@Service
public class StudyAiServiceImpl implements StudyAiService {

    private static final Logger log = LoggerFactory.getLogger(StudyAiServiceImpl.class);
    private static final String DEFAULT_COURSE = "cs301";
    private static final String NO_KEY = "Chưa cấu hình khóa AI. Bạn vẫn có thể tự soạn nội dung.";
    private static final String NO_MATERIAL = "Chưa có học liệu đã lập chỉ mục cho học phần này.";
    private static final String PROVIDER_DOWN = "Trợ lý AI tạm thời không phản hồi. Bạn hãy thử lại sau.";
    private static final int MAX_GAPS = 30;
    private static final int MAX_INSIGHT_PAGES = 12;
    private static final int MISTAKE_SOURCES = 5;
    private static final int[] INTERVALS = {1, 3, 7, 14, 30};
    private static final Duration RETRY_FORGOTTEN = Duration.ofMinutes(10);
    private static final Pattern EMAIL = Pattern.compile("\\b[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}\\b");

    private final AiClient client;
    private final RagAnswerService rag;
    private final LessonExplainer explainer;
    private final ClassInsightsGenerator insightsGenerator;
    private final StudyAidGenerator aidGenerator;
    private final MistakeCoach coach;
    private final AnalyticsService analytics;
    private final IClassInfoDao classDao;
    private final ILessonExplanationDao explanationDao;
    private final ILearningAidDao aidDao;
    private final ICardReviewDao reviewDao;
    private final IMistakeExplanationDao mistakeDao;
    private final IKnowledgeGapDao gapDao;
    private final vn.edu.vju.lms.service.AssignmentPolicy assignmentPolicy;
    private final IAssignmentDao assignmentDao;
    private final IAssessmentDao assessmentDao;
    private final IUserAccountDao userDao;
    private final TransactionTemplate transaction;

    @SuppressWarnings("java:S107")
    public StudyAiServiceImpl(AiClient client, RagAnswerService rag, LessonExplainer explainer,
            ClassInsightsGenerator insightsGenerator, StudyAidGenerator aidGenerator, MistakeCoach coach,
            AnalyticsService analytics, IClassInfoDao classDao, ILessonExplanationDao explanationDao, ILearningAidDao aidDao,
            ICardReviewDao reviewDao, IMistakeExplanationDao mistakeDao, IKnowledgeGapDao gapDao,
            IAssignmentDao assignmentDao, IAssessmentDao assessmentDao, IUserAccountDao userDao,
            TransactionTemplate transaction, vn.edu.vju.lms.service.AssignmentPolicy assignmentPolicy) {
        this.assignmentPolicy=assignmentPolicy;
        this.client = client;
        this.rag = rag;
        this.explainer = explainer;
        this.insightsGenerator = insightsGenerator;
        this.aidGenerator = aidGenerator;
        this.coach = coach;
        this.analytics = analytics;
        this.classDao = classDao;
        this.explanationDao = explanationDao;
        this.aidDao = aidDao;
        this.reviewDao = reviewDao;
        this.mistakeDao = mistakeDao;
        this.gapDao = gapDao;
        this.assignmentDao = assignmentDao;
        this.assessmentDao = assessmentDao;
        this.userDao = userDao;
        this.transaction = transaction;
    }

    // Bài giảng AI

    @Override
    public List<Explanation> explanations(String courseId) {
        UserPrincipal user = UserPrincipal.current();
        String course = course(courseId);
        if (user.isStudent() && scope(user, course).isEmpty()) {
            return List.of();
        }
        return transaction.execute(s -> explanationDao.findByCourse(course).stream()
                .filter(e -> !user.isStudent() || e.isPublished()).map(this::toWrapper).toList());
    }

    @Override
    public List<Explanation> generateExplanations(String courseId, ExplainRequest request) {
        String course = course(courseId);
        requireModel();
        Map<Integer, String> pages = RagAlgorithms.pageTexts(chunks(UserPrincipal.current(), course));
        if (pages.isEmpty()) {
            throw new BusinessRuleException(NO_MATERIAL);
        }
        boolean overwrite = request != null && request.overwriteEdited();
        List<Integer> requested = request == null || request.pages() == null ? null : request.pages();
        Map<String, LessonExplanation> existing = transaction.execute(s -> explanationDao.findByCourse(course).stream()
                .collect(Collectors.toMap(LessonExplanation::getId, Function.identity())));
        List<Integer> targets = pages.keySet().stream()
                .filter(page -> requested == null || requested.contains(page))
                .filter(page -> overwrite || !isEdited(existing.get(LessonExplanation.key(course, page))))
                .toList();
        if (targets.isEmpty()) {
            throw new BusinessRuleException("Không có trang nào cần soạn: các trang đã chọn đều do giảng viên chỉnh sửa.");
        }
        Map<Integer, String> drafts;
        try {
            drafts = explainer.explain(pages, targets);
        } catch (AiProviderException e) {
            throw new BusinessRuleException(e.getMessage());
        }
        log.info("Drafted {} lesson explanations for course {}", drafts.size(), course);
        return transaction.execute(s -> {
            drafts.forEach((page, content) -> {
                LessonExplanation row = explanationDao.findById(LessonExplanation.key(course, page)).orElse(null);
                boolean created = row == null;
                if (created) {
                    row = new LessonExplanation();
                    row.setId(LessonExplanation.key(course, page));
                    row.setCourseId(course);
                    row.setPage(page);
                }
                // A new draft is unreviewed again, so it leaves the students' view until it is republished.
                row.setContent(content);
                row.setEdited(false);
                row.setPublished(false);
                row.setUpdatedAt(Instant.now());
                if (created) {
                    explanationDao.persist(row);
                }
            });
            return explanationDao.findByCourse(course).stream().map(this::toWrapper).toList();
        });
    }

    private boolean isEdited(LessonExplanation row) {
        return row != null && row.isEdited();
    }

    @Override
    public Explanation updateExplanation(String courseId, int page, ExplanationUpdate update) {
        String course = course(courseId);
        if (page < 1) {
            throw new BusinessRuleException("Số trang không hợp lệ.");
        }
        return transaction.execute(s -> {
            LessonExplanation row = explanationDao.findById(LessonExplanation.key(course, page)).orElse(null);
            boolean hasContent = StringUtils.hasText(update.content());
            if (row == null) {
                if (!hasContent) {
                    throw new BusinessRuleException("Nhập nội dung bài giảng cho trang này.");
                }
                row = new LessonExplanation();
                row.setId(LessonExplanation.key(course, page));
                row.setCourseId(course);
                row.setPage(page);
                row.setContent(update.content().strip());
                explanationDao.persist(row);
            }
            if (hasContent && !update.content().strip().equals(row.getContent())) {
                row.setContent(update.content().strip());
                row.setEdited(true);
            }
            if (update.published() != null) {
                row.setPublished(update.published());
            }
            row.setUpdatedAt(Instant.now());
            return toWrapper(row);
        });
    }

    private Explanation toWrapper(LessonExplanation row) {
        return new Explanation(row.getId(), row.getCourseId(), row.getPage(), row.getContent(), row.isPublished(),
                row.isEdited(), row.getUpdatedAt().toString());
    }

    // Gợi ý buổi học

    @Override
    public Insights insights(String courseId) {
        String course = course(courseId);
        List<PageReport> stats = analytics.report().pages();
        Insights rules = ClassInsightsGenerator.fromStatistics(stats);
        List<ClassInsightsGenerator.Gap> gaps = transaction.execute(s -> openGaps().stream()
                .map(gap -> new ClassInsightsGenerator.Gap(gap.getPage() == null ? 0 : gap.getPage(), redact(gap.getBody())))
                .toList());
        if (!client.chatConfigured() || (rules.themes().isEmpty() && gaps.isEmpty())) {
            return rules;
        }
        Set<Integer> relevant = new LinkedHashSet<>();
        rules.themes().forEach(theme -> relevant.addAll(theme.pages()));
        gaps.forEach(gap -> relevant.add(gap.page()));
        Map<Integer, String> pages = RagAlgorithms.pageTexts(chunks(UserPrincipal.current(), course));
        pages.keySet().retainAll(relevant.stream().limit(MAX_INSIGHT_PAGES).toList());
        try {
            return insightsGenerator.generate(stats, gaps, pages);
        } catch (AiProviderException e) {
            log.warn("Class insights fell back to statistics: {}", e.getMessage());
            return rules;
        }
    }

    private List<KnowledgeGap> openGaps() {
        return gapDao.findAll().stream().filter(gap -> !StringUtils.hasText(gap.getResponse()) && StringUtils.hasText(gap.getBody()))
                .limit(MAX_GAPS).toList();
    }

    /** Student names, ids and email addresses never reach the model, as in study_support.redact_identities. */
    private String redact(String body) {
        String text = body.length() > 500 ? body.substring(0, 500) : body;
        List<String> identities = new ArrayList<>();
        for (UserAccount account : userDao.findAll()) {
            if (account.getRole() == Role.STUDENT) {
                for (String value : new String[] {account.getName(), account.getId(), account.getEmail()}) {
                    if (value != null && value.length() >= 3) {
                        identities.add(value);
                    }
                }
            }
        }
        identities.sort(Comparator.comparingInt(String::length).reversed());
        for (String identity : identities) {
            text = Pattern.compile(Pattern.quote(identity), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                    .matcher(text).replaceAll("[ẩn danh]");
        }
        return EMAIL.matcher(text).replaceAll("[ẩn danh]");
    }

    // Giải thích câu sai

    @Override
    public MistakeExplanationWrapper explainMistake(MistakeRequest request) {
        UserPrincipal user = UserPrincipal.current();
        record Work(ExamQuestion question, String answer, int attempts) {
        }
        Work work = transaction.execute(s -> {
            Assessment record = assessmentDao.find(user.id(), request.assignmentId())
                    .filter(r -> r.getAnswers() != null && StringUtils.hasText(r.getSubmitted()))
                    .orElseThrow(() -> new BusinessRuleException("Chỉ giải thích được câu của bài đã nộp."));
            vn.edu.vju.lms.entity.Assignment assignment = assignmentDao.findById(request.assignmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập."));
            assignmentPolicy.requireRead(assignment);
            if(!Boolean.TRUE.equals(assignment.getAnswersReleased())) throw new BusinessRuleException("Chờ công bố đáp án để xem giải thích.");
            List<ExamQuestion> questions = AssessmentGrader.questionsOf(assignment);
            // The student numbers questions in their own, possibly shuffled, order.
            int index = vn.edu.vju.lms.service.ExamOrder.originalIndex(request.questionIndex(),
                    vn.edu.vju.lms.service.ExamOrder.of(assignment, user.id()));
            if (index < 0 || index >= questions.size()) {
                throw new BusinessRuleException("Câu hỏi không hợp lệ.");
            }
            String answer = index < record.getAnswers().size() ? record.getAnswers().get(index) : null;
            return new Work(questions.get(index), answer, record.getAttempts());
        });
        ExamQuestion question = work.question();
        if (question.isEssay() || AssessmentGrader.isCorrect(question, work.answer())) {
            throw new BusinessRuleException("Chỉ giải thích câu trắc nghiệm hoặc điền trống đã trả lời sai.");
        }
        String key = String.join(":", user.id(), request.assignmentId(), String.valueOf(work.attempts()),
                String.valueOf(request.questionIndex()));
        MistakeExplanation cached = transaction.execute(s -> mistakeDao.findById(key).orElse(null));
        if (cached != null) {
            return new MistakeExplanationWrapper(cached.getAnswer(), cached.getPages(), cached.getMode());
        }
        String correct = shown(question, question.getCorrect().split("\\|")[0]);
        String given = shown(question, work.answer());
        List<RagChunk> sources = rag.search(question.getText() + " " + correct, chunks(user, course(request.courseId())), MISTAKE_SOURCES);
        if (client.chatConfigured() && !sources.isEmpty()) {
            try {
                RagAlgorithms.ValidatedAnswer valid = coach.explain(question.getText(), question.getOptions(), correct, given, sources);
                if (!valid.answer().isEmpty()) {
                    List<Integer> pages = valid.citations().stream().map(RagChunk::getPage).distinct().toList();
                    MistakeExplanation saved = new MistakeExplanation();
                    saved.setId(key);
                    saved.setAnswer(valid.answer());
                    saved.setPages(pages);
                    saved.setMode("ai");
                    transaction.executeWithoutResult(s -> mistakeDao.persist(saved));
                    return new MistakeExplanationWrapper(valid.answer(), pages, "ai");
                }
            } catch (AiProviderException e) {
                log.warn("Mistake explanation fell back to the passage: {}", e.getMessage());
            }
        }
        return extractive(question, correct, sources);
    }

    private MistakeExplanationWrapper extractive(ExamQuestion question, String correct, List<RagChunk> sources) {
        StringBuilder text = new StringBuilder("Đáp án đúng là \"").append(correct).append("\".");
        if (StringUtils.hasText(question.getExplanation())) {
            text.append(' ').append(question.getExplanation().strip());
        }
        if (sources.isEmpty()) {
            return new MistakeExplanationWrapper(text.toString(), List.of(), "extractive");
        }
        RagChunk best = sources.get(0);
        text.append("\n\nĐoạn liên quan trong \"").append(best.getMaterialTitle()).append("\", trang ").append(best.getPage())
                .append(": ").append(best.getText().strip());
        return new MistakeExplanationWrapper(text.toString(), List.of(best.getPage()), "extractive");
    }

    private static String shown(ExamQuestion question, String answer) {
        if (answer == null || answer.isBlank()) {
            return "(bỏ trống)";
        }
        if (ExamQuestion.CHOICE.equals(question.getType()) && question.getOptions() != null) {
            try {
                int index = Integer.parseInt(answer.strip());
                return index >= 0 && index < question.getOptions().size() ? question.getOptions().get(index) : answer;
            } catch (NumberFormatException e) {
                return answer;
            }
        }
        return answer;
    }

    // Thẻ ôn và FAQ

    @Override
    public List<Aid> aids(String courseId, String kind) {
        UserPrincipal user = UserPrincipal.current();
        String course = course(courseId);
        if (user.isStudent() && scope(user, course).isEmpty()) {
            return List.of();
        }
        return transaction.execute(s -> {
            Map<String, CardReview> reviews = user.isStudent()
                    ? reviewDao.findByStudent(user.id()).stream().collect(Collectors.toMap(CardReview::getAidId, Function.identity()))
                    : Map.of();
            return aidDao.findByCourse(course).stream()
                    .filter(aid -> kind == null || kind.isBlank() || kind.equals(aid.getKind()))
                    .filter(aid -> !user.isStudent() || aid.isPublished())
                    .map(aid -> toWrapper(aid, reviews.get(aid.getId()))).toList();
        });
    }

    @Override
    public List<Aid> generateAids(AidGenerateRequest request) {
        String kind = kind(request.kind());
        String course = course(request.courseId());
        requireModel();
        List<RagChunk> chunks = chunks(UserPrincipal.current(), course);
        if (chunks.isEmpty()) {
            throw new BusinessRuleException(NO_MATERIAL);
        }
        List<String> gaps = List.of();
        List<RagChunk> sources;
        if (LearningAid.FAQ.equals(kind)) {
            List<KnowledgeGap> open = transaction.execute(s -> openGaps());
            if (open.isEmpty()) {
                throw new BusinessRuleException("Chưa có kiến thức mờ nào cần giải đáp để soạn FAQ.");
            }
            gaps = transaction.execute(s -> open.stream().map(gap -> redact(gap.getBody())).toList());
            Set<Integer> pages = open.stream().map(KnowledgeGap::getPage).filter(p -> p != null).collect(Collectors.toSet());
            List<RagChunk> onPages = chunks.stream().filter(chunk -> pages.contains(chunk.getPage())).limit(12).toList();
            sources = onPages.isEmpty() ? StudyAidGenerator.spread(chunks) : onPages;
        } else {
            sources = StudyAidGenerator.spread(chunks);
        }
        List<StudyAidGenerator.Draft> drafts;
        try {
            drafts = aidGenerator.generate(kind, sources, gaps);
        } catch (AiProviderException e) {
            throw new BusinessRuleException(PROVIDER_DOWN);
        }
        if (drafts.isEmpty()) {
            throw new BusinessRuleException("Model chưa trả nội dung có nguồn hợp lệ. Chưa tạo bản nháp.");
        }
        return transaction.execute(s -> drafts.stream().map(draft -> {
            LearningAid aid = newAid(course, kind, draft.front(), draft.back(), draft.topic(), draft.page(), "ai");
            aidDao.persist(aid);
            return toWrapper(aid, null);
        }).toList());
    }

    @Override
    public Aid createAid(AidCreate request) {
        String kind = kind(request.kind());
        LearningAid aid = newAid(course(request.courseId()), kind, request.front().strip(), request.back().strip(),
                request.topic() == null ? "" : request.topic().strip(), request.page(), "manual");
        transaction.executeWithoutResult(s -> aidDao.persist(aid));
        return toWrapper(aid, null);
    }

    @Override
    public Aid updateAid(String id, AidUpdate update) {
        return transaction.execute(s -> {
            LearningAid aid = findAid(id);
            if (StringUtils.hasText(update.front())) {
                aid.setFront(update.front().strip());
            }
            if (StringUtils.hasText(update.back())) {
                aid.setBack(update.back().strip());
            }
            if (update.topic() != null) {
                aid.setTopic(update.topic().strip());
            }
            if (update.published() != null) {
                aid.setPublished(update.published());
            }
            return toWrapper(aid, null);
        });
    }

    @Override
    public void deleteAid(String id) {
        transaction.executeWithoutResult(s -> {
            LearningAid aid = findAid(id);
            reviewDao.deleteByAid(id);
            aidDao.remove(aid);
        });
    }

    @Override
    public ReviewState review(String aidId, boolean remembered) {
        UserPrincipal user = UserPrincipal.current();
        LearningAid aid = transaction.execute(s -> aidDao.findById(aidId)
                .filter(a -> a.isPublished() && LearningAid.CARD.equals(a.getKind()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thẻ ôn.")));
        if (scope(user, aid.getCourseId()).isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy thẻ ôn.");
        }
        Instant now = Instant.now();
        return transaction.execute(s -> {
            String key = CardReview.key(user.id(), aidId);
            CardReview review = reviewDao.findById(key).orElse(null);
            if (review == null) {
                review = new CardReview();
                review.setId(key);
                review.setStudentId(user.id());
                review.setAidId(aidId);
                review.setDueAt(now);
                reviewDao.persist(review);
            }
            schedule(review, remembered, now);
            return state(review, now);
        });
    }

    /** Fixed intervals are transparent and cheap, as in study_support.review_card. */
    static void schedule(CardReview review, boolean remembered, Instant now) {
        if (remembered) {
            review.setIntervalDays(INTERVALS[Math.min(review.getRepetitions(), INTERVALS.length - 1)]);
            review.setRepetitions(review.getRepetitions() + 1);
            review.setDueAt(now.plus(Duration.ofDays(review.getIntervalDays())));
        } else {
            review.setIntervalDays(0);
            review.setRepetitions(0);
            review.setDueAt(now.plus(RETRY_FORGOTTEN));
        }
        review.setReviewedAt(now);
    }

    private static ReviewState state(CardReview review, Instant now) {
        return new ReviewState(review.getRepetitions(), review.getIntervalDays(), review.getDueAt().toString(),
                !review.getDueAt().isAfter(now));
    }

    private LearningAid findAid(String id) {
        return aidDao.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nội dung ôn tập."));
    }

    private static LearningAid newAid(String course, String kind, String front, String back, String topic, Integer page,
            String origin) {
        LearningAid aid = new LearningAid();
        aid.setId(UUID.randomUUID().toString());
        aid.setCourseId(course);
        aid.setKind(kind);
        aid.setFront(front);
        aid.setBack(back);
        aid.setTopic(topic);
        aid.setPage(page);
        aid.setOrigin(origin);
        aid.setPublished(false);
        return aid;
    }

    private Aid toWrapper(LearningAid aid, CardReview review) {
        return new Aid(aid.getId(), aid.getCourseId(), aid.getKind(), aid.getFront(), aid.getBack(), aid.getTopic(),
                aid.getPage(), aid.isPublished(), aid.getOrigin(), review == null ? null : state(review, Instant.now()));
    }

    private static String kind(String kind) {
        if (!LearningAid.CARD.equals(kind) && !LearningAid.FAQ.equals(kind)) {
            throw new BusinessRuleException("Loại nội dung phải là card hoặc faq.");
        }
        return kind;
    }

    // Phạm vi

    private void requireModel() {
        if (!client.chatConfigured()) {
            throw new BusinessRuleException(NO_KEY);
        }
    }

    private static String course(String courseId) {
        return StringUtils.hasText(courseId) ? courseId : DEFAULT_COURSE;
    }

    /** Students only reach classes they are enrolled in; staff reach every class of the course. */
    private List<String> scope(UserPrincipal user, String courseId) {
        return transaction.execute(s -> classDao.findByCourse(courseId).stream()
                .filter(info -> !user.isStudent() || info.getStudentIds().contains(user.id()))
                .map(ClassInfo::getId).toList());
    }

    private List<RagChunk> chunks(UserPrincipal user, String courseId) {
        List<String> classes = scope(user, courseId);
        return classes.isEmpty() ? List.of() : rag.candidates(classes);
    }
}
