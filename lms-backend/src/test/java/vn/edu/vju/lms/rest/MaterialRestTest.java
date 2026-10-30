package vn.edu.vju.lms.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import vn.edu.vju.lms.AbstractApiTest;
import vn.edu.vju.lms.dao.IClassInfoDao;
import vn.edu.vju.lms.dao.IMaterialVersionDao;
import vn.edu.vju.lms.entity.ClassInfo;
import vn.edu.vju.lms.entity.MaterialVersion;

class MaterialRestTest extends AbstractApiTest {

    private static final String URL = "/api/materials";

    @Autowired
    private IClassInfoDao classDao;

    @Autowired
    private IMaterialVersionDao versionDao;

    private String classId;

    @BeforeEach
    void data() {
        classId = "MA-" + UUID.randomUUID().toString().substring(0, 8);
        ClassInfo info = new ClassInfo();
        info.setId(classId);
        info.setCourseId("cs-material");
        info.setName(classId);
        info.setTeacherId(LECTURER);
        info.getStudentIds().add(STUDENT);
        tx.executeWithoutResult(s -> classDao.persist(info));
    }

    static byte[] pdf(String text) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(50, 700);
                content.showText(text);
                content.endText();
            }
            document.save(out);
            return out.toByteArray();
        }
    }

    private MockMultipartFile file(String name, byte[] bytes) {
        return new MockMultipartFile("file", name, "application/octet-stream", bytes);
    }

    private String upload(byte[] bytes) throws Exception {
        String body = mvc.perform(multipart(URL).file(file("bai.pdf", bytes)).param("classId", classId).param("title", "Bài")
                .headers(auth(LECTURER))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).path("id").asText();
    }

    private byte[] download(String id, String user) throws Exception {
        MvcResult async = mvc.perform(get(URL + "/" + id + "/file").headers(auth(user)))
                .andExpect(request().asyncStarted()).andReturn();
        return mvc.perform(asyncDispatch(async)).andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
    }

    @Test
    void fileIsEncryptedOnDiskAndDecryptedOnDownload() throws Exception {
        byte[] bytes = pdf("Secret lecture text");
        String id = upload(bytes);
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(LECTURER))).andExpect(jsonPath("$.status").value("published"));

        MaterialVersion version = tx.execute(s -> versionDao.find(id, 1).orElseThrow());
        byte[] stored = Files.readAllBytes(Path.of("./target/test-storage").resolve(version.getStoredPath()));
        assertThat(new String(stored, StandardCharsets.ISO_8859_1)).doesNotContain("%PDF-");

        assertThat(download(id, STUDENT)).isEqualTo(bytes);
    }

    @Test
    void draftsAreHiddenFromStudents() throws Exception {
        String id = upload(pdf("Draft"));
        mvc.perform(get(URL).param("classId", classId).headers(auth(STUDENT))).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get(URL).param("classId", classId).headers(auth(LECTURER))).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get(URL + "/" + id + "/file").headers(auth(STUDENT))).andExpect(status().isNotFound());
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(post(URL + "/" + id + "/unpublish").headers(auth(LECTURER))).andExpect(jsonPath("$.status").value("draft"));
    }

    @Test
    void studentsOutsideTheClassAreRefused() throws Exception {
        String id = upload(pdf("Class only"));
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(get(URL).param("classId", classId).headers(auth(OTHER_STUDENT))).andExpect(status().isForbidden());
        mvc.perform(get(URL + "/" + id + "/file").headers(auth(OTHER_STUDENT))).andExpect(status().isNotFound());
    }

    @Test
    void onlyTheClassStaffCanManage() throws Exception {
        String id = upload(pdf("Owned"));
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(LEADER))).andExpect(status().isForbidden());
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(STUDENT))).andExpect(status().isForbidden());
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(ADMIN))).andExpect(status().isOk());
        mvc.perform(delete(URL + "/" + id).headers(auth(LECTURER))).andExpect(status().isNoContent());
        mvc.perform(delete(URL + "/" + id).headers(auth(LECTURER))).andExpect(status().isNotFound());
    }

    @Test
    void rejectsInvalidUploads() throws Exception {
        mvc.perform(multipart(URL).file(file("gia.pdf", "not a pdf".getBytes())).param("classId", classId).param("title", "t").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart(URL).file(file("virus.exe", new byte[10])).param("classId", classId).param("title", "t").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart(URL).file(file("a.pdf", pdf("x"))).param("classId", classId).param("title", " ").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart(URL).file(file("a.pdf", pdf("x"))).param("classId", classId).param("title", "t").param("weekNumber", "21").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart(URL).file(file("a.pdf", pdf("x"))).param("classId", "khong-co").param("title", "t").headers(auth(LECTURER)))
                .andExpect(status().isNotFound());
    }

    @Test
    void newVersionReplacesTheCurrentFile() throws Exception {
        String id = upload(pdf("Version one"));
        byte[] second = pdf("Version two");
        mvc.perform(multipart(URL + "/" + id + "/versions").file(file("v2.pdf", second)).headers(auth(LECTURER)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentVersion").value(2))
                .andExpect(jsonPath("$.originalName").value("v2.pdf"));
        assertThat(download(id, LECTURER)).isEqualTo(second);
        mvc.perform(multipart(URL + "/" + id + "/versions").file(file("v.mp4", new byte[10])).headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void indexingRunsInTheBackgroundAndFeedsTheAssistant() throws Exception {
        String id = upload(pdf("Photosynthesis converts sunlight into chemical energy"));
        mvc.perform(post(URL + "/" + id + "/index").headers(auth(LECTURER)))
                .andExpect(status().isBadRequest());
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(post(URL + "/" + id + "/index").headers(auth(LECTURER))).andExpect(status().isAccepted());
        await().atMost(Duration.ofSeconds(10)).until(() -> "ready".equals(indexStatus()));

        mvc.perform(post("/api/ai/ask").headers(auth(STUDENT)).contentType(JSON)
                .content(json(java.util.Map.of("courseId", "cs-material", "question", "photosynthesis sunlight"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sources[0]").value(1));
    }

    private String indexStatus() throws Exception {
        String body = mvc.perform(get(URL).param("classId", classId).headers(auth(LECTURER))).andReturn().getResponse().getContentAsString();
        JsonNode list = mapper.readTree(body);
        return list.path(0).path("indexStatus").asText();
    }

    @Test
    void unreadablePdfMarksIndexingFailed() throws Exception {
        String id = upload("%PDF-1.7 broken".getBytes(StandardCharsets.US_ASCII));
        mvc.perform(post(URL + "/" + id + "/publish").headers(auth(LECTURER))).andExpect(status().isOk());
        mvc.perform(post(URL + "/" + id + "/index").headers(auth(LECTURER))).andExpect(status().isAccepted());
        await().atMost(Duration.ofSeconds(10)).until(() -> "failed".equals(indexStatus()));
        assertThat(List.of("failed")).contains(indexStatus());
    }
}
