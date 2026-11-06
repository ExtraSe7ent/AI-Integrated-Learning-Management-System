package vn.edu.vju.lms.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import vn.edu.vju.lms.ai.RagIndexer;
import vn.edu.vju.lms.crypto.AesService;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IMaterialDao;
import vn.edu.vju.lms.dao.IMaterialVersionDao;
import vn.edu.vju.lms.dao.INoticeDao;
import vn.edu.vju.lms.dao.IUserAccountDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.Material;
import vn.edu.vju.lms.entity.MaterialVersion;
import vn.edu.vju.lms.entity.Notice;
import vn.edu.vju.lms.entity.UserAccount;
import vn.edu.vju.lms.security.Role;

/** Loads the frontend's sample data on an empty database. Disabled unless lms.seed.enabled=true. */
@Component
@ConditionalOnProperty(prefix = "lms.seed", name = "enabled", havingValue = "true")
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String PDF = "seed/demo-lesson.pdf";
    private static final String SEED_CLASS = "CSE301.01";
    private static final String SEED_STUDENT = "23110149";

    private final IUserAccountDao userDao;
    private final IClassInfoDao classDao;
    private final INoticeDao noticeDao;
    private final IMaterialDao materialDao;
    private final IMaterialVersionDao versionDao;
    private final jakarta.persistence.EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;
    private final AesService aesService;
    private final RagIndexer indexer;
    private final TransactionTemplate transaction;
    private final LmsProperties properties;
    private final ObjectMapper mapper;

    public DataSeeder(IUserAccountDao userDao, IClassInfoDao classDao, INoticeDao noticeDao, IMaterialDao materialDao,
            IMaterialVersionDao versionDao, jakarta.persistence.EntityManager entityManager, PasswordEncoder passwordEncoder,
            AesService aesService, RagIndexer indexer, TransactionTemplate transaction, LmsProperties properties,
            ObjectMapper mapper) {
        this.userDao = userDao;
        this.classDao = classDao;
        this.noticeDao = noticeDao;
        this.materialDao = materialDao;
        this.versionDao = versionDao;
        this.entityManager = entityManager;
        this.passwordEncoder = passwordEncoder;
        this.aesService = aesService;
        this.indexer = indexer;
        this.transaction = transaction;
        this.properties = properties;
        this.mapper = mapper.copy().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (userDao.count() == 0) {
            seedAll();
        }
    }

    /** Deletes every row and loads the demo data again. */
    public void reset() throws IOException {
        transaction.executeWithoutResult(s -> entityManager.getMetamodel().getEntities().forEach(type ->
                entityManager.createQuery("SELECT e FROM " + type.getName() + " e").getResultList()
                        .forEach(entityManager::remove)));
        seedAll();
    }

    private void seedAll() throws IOException {
        JsonNode data;
        try (InputStream in = new ClassPathResource("seed/demo-data.json").getInputStream()) {
            data = mapper.readTree(in);
        }
        transaction.executeWithoutResult(s -> seed(data));
        String materialId = transaction.execute(s -> seedMaterial());
        indexer.index(materialId);
        log.info("Seeded demo data; default password applies to all demo accounts");
    }

    private void seed(JsonNode data) {
        data.path("admin").path("users").forEach(this::seedUser);
        data.path("admin").path("classes").forEach(item -> classDao.persist(mapper.convertValue(item, ClassInfo.class)));
        persistAll(data.path("admin").path("courses"), vn.edu.vju.lms.entity.Course.class);
        persistAll(data.path("lessons"), vn.edu.vju.lms.entity.Lesson.class);
        persistAll(data.path("questions"), vn.edu.vju.lms.entity.Question.class);
        persistAll(data.path("sessions"), vn.edu.vju.lms.entity.StudySession.class);
        persistAll(data.path("assignments"), vn.edu.vju.lms.entity.Assignment.class);
        persistAll(data.path("resources"), vn.edu.vju.lms.entity.ResourceItem.class);
        persistAll(owned(data.path("gaps")), vn.edu.vju.lms.entity.KnowledgeGap.class);
        persistAll(owned(data.path("feedback")), vn.edu.vju.lms.entity.Feedback.class);
        persistAll(data.path("coordination").path("items"), vn.edu.vju.lms.entity.CoordinationItem.class);
        persistAll(data.path("coordination").path("requests"), vn.edu.vju.lms.entity.ChangeRequest.class);
        persistAll(data.path("coordination").path("references"), vn.edu.vju.lms.entity.ReferenceItem.class);
        seedNotices(data.path("notices"), "student");
        seedNotices(data.path("teacherNotices"), "teacher");
    }

    private JsonNode owned(JsonNode items) {
        items.forEach(item -> ((ObjectNode) item).put("ownerId", SEED_STUDENT));
        return items;
    }

    private <T> void persistAll(JsonNode items, Class<T> type) {
        for (JsonNode item : items) {
            T entity = mapper.convertValue(item, type);
            entityManager.persist(entity);
        }
    }

    private void seedUser(JsonNode item) {
        UserAccount user = new UserAccount();
        user.setId(item.path("id").asText());
        user.setName(item.path("name").asText());
        user.setEmail(item.path("email").asText());
        user.setEmailHash(aesService.blindIndex(user.getEmail().toLowerCase(Locale.ROOT)));
        user.setFaculty(item.path("faculty").asText());
        user.setKind(item.path("kind").asText());
        user.setRole(Role.fromCode(item.path("role").asText()));
        user.setPasswordHash(passwordEncoder.encode(properties.getDefaultPassword()));
        userDao.persist(user);
    }

    private void seedNotices(JsonNode messages, String audience) {
        List<String> list = new ArrayList<>();
        messages.forEach(message -> list.add(message.asText()));
        list.forEach(message -> {
            Notice notice = new Notice();
            notice.setId(UUID.randomUUID().toString());
            notice.setAudience(audience);
            notice.setMessage(message);
            noticeDao.persist(notice);
        });
    }

    private String seedMaterial() {
        Material material = new Material();
        material.setId("seed-rest-pdf");
        material.setClassId(SEED_CLASS);
        material.setTitle("Bài giảng RESTful API");
        material.setStatus(Material.PUBLISHED);
        material.setCurrentVersion(1);
        materialDao.persist(material);
        String relative = "materials/seed-rest-pdf/" + UUID.randomUUID() + ".enc";
        Path target = Path.of(properties.getStorage().getRoot()).resolve(relative);
        try (InputStream in = new ClassPathResource(PDF).getInputStream()) {
            Files.createDirectories(target.getParent());
            aesService.encryptFile(in, target);
        } catch (IOException e) {
            throw new IllegalStateException("Không tạo được học liệu mẫu.", e);
        }
        MaterialVersion version = new MaterialVersion();
        version.setMaterialId(material.getId());
        version.setNumber(1);
        version.setStoredPath(relative);
        version.setOriginalName("demo-lesson.pdf");
        version.setFileSize(target.toFile().length());
        versionDao.persist(version);
        return material.getId();
    }
}
