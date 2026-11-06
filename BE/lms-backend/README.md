# VJU Learning — Backend (Spring Boot)

Backend Java thay thế bản Django của dự án. Phục vụ frontend React qua REST API.

**Công nghệ:** Java 21, Spring Boot 3.5, Spring Security + JWT, JPA/Hibernate, H2 (local) / PostgreSQL (production), Springdoc OpenAPI, Lombok, SLF4J + Log4j2, PDFBox.

## Chạy

Cần JDK 21. Không cần cài Maven (dự án có Maven Wrapper) và không cần database riêng.

```powershell
.\mvnw.cmd spring-boot:run
```

- API: http://127.0.0.1:8080
- Swagger UI: http://127.0.0.1:8080/swagger-ui.html

Lần chạy đầu tự tạo database `./data` và nạp dữ liệu mẫu. Tài khoản mẫu, mật khẩu `12345678`: `23110149` (sinh viên), `GV001` (giảng viên), `TK001` (Trưởng khoa), `TN001` (Trưởng nhóm HP), `AD001` (Admin).

Muốn về dữ liệu mẫu ban đầu: dừng ứng dụng rồi xóa thư mục `data` và `private_media`.

## Kiểm thử

```powershell
.\mvnw.cmd verify
```

Lệnh chạy toàn bộ JUnit và **fail nếu coverage dòng hoặc nhánh dưới 80%** (JaCoCo). Báo cáo ở `target/site/jacoco/index.html`.

| Loại | Cách test |
| --- | --- |
| DAO | `ClassInfoDaoImplTest`: truy vấn thật trên H2 |
| Service | `ClassInfoServiceImplTest`: Mockito với `@Mock` + `@InjectMocks` |
| REST | `*RestTest`: `MockMvc` qua security filter thật, kiểm tra cả phân quyền |
| Tích hợp | `AbstractApiTest`: toàn bộ stack với H2 in-memory |
| AI | Stub HTTP cục bộ, không gọi nhà cung cấp thật và không tốn credit |

## Kiến trúc

Mỗi module theo cùng một mẫu phân lớp:

```text
rest/        ClassInfoRest            interface: mapping, @PreAuthorize, Swagger
rest/impl/   ClassInfoRestImpl        @RestController
service/     ClassInfoService         interface nghiệp vụ
service/impl ClassInfoServiceImpl     @Service, @Transactional, mapWrapperToEntity
dao/         IClassInfoDao            interface truy cập dữ liệu
dao/impl/    ClassInfoDaoImpl         @Repository, kế thừa HibernateGenericDao
entity/      ClassInfo                JPA entity
wrapper/     ClassInfoWrapper         DTO, tách entity khỏi API
```

Phần dùng chung nằm ở `common/`:

- `HibernateGenericDao<K, T>`: DAO tổng quát trên `EntityManager`, JPQL, `TypedQuery`, xử lý `NoResultException`.
- `AbstractCrudService`: luồng CRUD; `PUT` là partial update, chỉ ghi các trường khác null.
- `SpecificationsBuilder`, `EntitySpecification`, `SearchCriteria`: tìm kiếm động bằng Criteria API.
- `PageRequests`, `PageResponse`: sắp xếp và phân trang.

### Tìm kiếm, sắp xếp, phân trang

Mỗi module có `GET .../search`:

```text
GET /api/class-info/search?search=name~CSE301,term:I&sort=name,desc&page=0&size=20
```

Toán tử: `:` bằng, `!` khác, `>` lớn hơn, `<` nhỏ hơn, `~` chứa.

### Phân quyền

`@PreAuthorize` ở từng method, vai trò lấy từ database theo mỗi request nên vô hiệu hóa tài khoản có hiệu lực ngay.

| Vai trò | Quyền trên `/api/class-info` |
| --- | --- |
| `ROLE_ADMIN` | Toàn quyền, gồm xóa, đếm, ghi danh |
| `ROLE_LECTURER` | Tạo, cập nhật, đọc |
| `ROLE_STUDENT`, `ROLE_DEAN`, `ROLE_COURSE_LEADER` | Chỉ đọc |

Tài khoản bị buộc đổi mật khẩu chỉ gọi được `/api/auth/*` cho tới khi đổi xong; điều này được chặn ở server trong `JwtAuthenticationFilter`.

### Mã hóa AES

`crypto/AesService` dùng AES-256-GCM, IV ngẫu nhiên, khóa dẫn xuất bằng `PBKDF2WithHmacSHA256`.

| Dữ liệu | Cách bảo vệ |
| --- | --- |
| Email, số điện thoại | `EncryptedStringConverter` mã hóa trong cột; email có thêm hash HMAC để kiểm tra trùng |
| Nội dung học liệu điều phối | Mã hóa trong cột `body` |
| Tệp PDF/video | Mã hóa theo chunk 1 MB trước khi ghi đĩa; thứ tự chunk được xác thực |
| Mật khẩu | BCrypt (băm một chiều, không phải AES) |

Đổi `LMS_AES_PASSPHRASE` hoặc `LMS_AES_SALT` sau khi đã có dữ liệu sẽ làm dữ liệu cũ không giải mã được.

## Hợp đồng với frontend

`GET /api/bootstrap` trả toàn bộ dữ liệu giao diện theo đúng cấu trúc `DemoData` của frontend, đã lọc theo vai trò. Khi người dùng thao tác, `FE/src/api/sync.ts` so sánh trạng thái cũ và mới rồi gọi REST tương ứng. Server luôn là nơi quyết định: điểm bài, quyền và quy tắc nghiệp vụ không tin dữ liệu từ client.

## AI

Không cần khóa API để chạy. Khi chưa có khóa, trợ lý dùng luật guardrail, luật trả lời mẫu cho CSE301 và tìm từ khóa trong PDF đã lập chỉ mục.

Muốn dùng RAG thật, đặt `OPENROUTER_API_KEY`, `VILAO_API_KEY` (xem `.env.example`) rồi lập chỉ mục lại học liệu.

**Lưu ý:** pipeline RAG mới được kiểm thử với stub, chưa từng chạy với nhà cung cấp thật. Hãy thử trước khi trình diễn.

## Production

```powershell
$env:SPRING_PROFILES_ACTIVE = "prod"
docker compose up -d db
.\mvnw.cmd spring-boot:run
```

Profile `prod` dùng PostgreSQL và bắt buộc có `LMS_JWT_SECRET`, `LMS_AES_PASSPHRASE`, `LMS_AES_SALT`; thiếu thì ứng dụng từ chối khởi động. Lược đồ đang do Hibernate `ddl-auto: update` quản lý; nên chuyển sang Flyway trước khi triển khai thật.

## Trạng thái port từ Django

| Đã port | Ghi chú |
| --- | --- |
| Tài khoản, lớp, bài tập, chấm bài, phúc khảo, phản hồi, tự học, kiến thức mờ, hỏi trên lớp, lịch, điểm danh, học liệu có phiên bản | |
| RAG cho PDF chữ | Chunking, embedding, hybrid retrieval, RRF, mở rộng ngữ cảnh, trích dẫn do backend gắn, guardrail, quota |

| Chưa port | Ghi chú |
| --- | --- |
| Video transcript, mô tả ảnh PDF bằng vision | Video upload được nhưng không lập chỉ mục |
| LLM rerank, streaming SSE, hồ sơ cá nhân hóa | Trả lời dạng một lần |
| Thẻ ôn, FAQ, kế hoạch tuần, Bài giảng AI, sinh câu hỏi AI, chấm nháp AI tự luận | Frontend hiện có bản mô phỏng cục bộ |
| Thông báo sự kiện tự động, gửi email, OTP quên mật khẩu | Frontend hướng dẫn liên hệ Admin |
| Phoenix tracing, lệnh đánh giá RAG | |
| Dữ liệu Django cũ | Chưa có script chuyển từ database cũ |
