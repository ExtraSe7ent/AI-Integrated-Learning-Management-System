package vn.edu.vju.lms.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Random;
import javax.crypto.SealedObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.edu.vju.lms.config.LmsProperties;

class AesServiceTest {

    @TempDir
    Path folder;

    private AesService service;

    private static LmsProperties properties(String passphrase) {
        LmsProperties properties = new LmsProperties();
        properties.getCrypto().setPassphrase(passphrase);
        properties.getCrypto().setSalt("salt");
        properties.getCrypto().setIterations(1000);
        return properties;
    }

    @BeforeEach
    void setUp() throws GeneralSecurityException {
        service = new AesService(properties("pass"));
    }

    @Test
    void roundTripKeepsVietnameseText() {
        String cipher = service.encrypt("Nguyễn Quang Anh");
        assertThat(cipher).doesNotContain("Nguyễn");
        assertThat(service.decrypt(cipher)).isEqualTo("Nguyễn Quang Anh");
    }

    @Test
    void sameTextEncryptsDifferentlyEachTime() {
        assertThat(service.encrypt("a")).isNotEqualTo(service.encrypt("a"));
    }

    @Test
    void nullPassesThrough() {
        assertThat(service.encrypt(null)).isNull();
        assertThat(service.decrypt(null)).isNull();
    }

    @Test
    void tamperedCipherTextIsRejected() {
        String cipher = service.encrypt("điểm 10");
        char last = cipher.charAt(cipher.length() - 3);
        String tampered = cipher.substring(0, cipher.length() - 3) + (last == 'A' ? 'B' : 'A') + cipher.substring(cipher.length() - 2);
        assertThatThrownBy(() -> service.decrypt(tampered)).isInstanceOf(CryptoException.class);
        assertThatThrownBy(() -> service.decrypt("không phải base64")).isInstanceOf(CryptoException.class);
    }

    @Test
    void otherKeyCannotDecrypt() throws GeneralSecurityException {
        AesService other = new AesService(properties("different"));
        String cipher = service.encrypt("bí mật");
        assertThatThrownBy(() -> other.decrypt(cipher)).isInstanceOf(CryptoException.class);
    }

    @Test
    void blindIndexIsStableAndKeyed() throws GeneralSecurityException {
        assertThat(service.blindIndex("a@b.c")).isEqualTo(service.blindIndex("a@b.c"));
        assertThat(service.blindIndex("a@b.c")).isNotEqualTo(new AesService(properties("different")).blindIndex("a@b.c"));
    }

    @Test
    void sealedObjectRoundTrip() {
        SealedObject sealed = service.seal("hồ sơ");
        assertThat(service.unseal(sealed)).isEqualTo("hồ sơ");
    }

    @Test
    void generatedKeyIs256Bits() throws GeneralSecurityException {
        assertThat(AesService.generateKey().getEncoded()).hasSize(32);
    }

    @Test
    void largeFileRoundTripAcrossChunks() {
        byte[] data = new byte[3 * 1024 * 1024 + 17];
        new Random(1).nextBytes(data);
        Path target = folder.resolve("large.enc");
        service.encryptFile(new ByteArrayInputStream(data), target);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        service.decryptFile(target, out);
        assertThat(out.toByteArray()).isEqualTo(data);
    }

    @Test
    void reorderedOrCorruptedFileChunksFail() throws IOException {
        byte[] data = new byte[2 * 1024 * 1024];
        Path target = folder.resolve("swap.enc");
        service.encryptFile(new ByteArrayInputStream(data), target);
        byte[] stored = Files.readAllBytes(target);
        int chunk = stored.length / 2;
        byte[] swapped = new byte[stored.length];
        System.arraycopy(stored, chunk, swapped, 0, chunk);
        System.arraycopy(stored, 0, swapped, chunk, chunk);
        Files.write(target, swapped);
        assertThatThrownBy(() -> service.decryptFile(target, new ByteArrayOutputStream())).isInstanceOf(CryptoException.class);

        byte[] corrupted = Arrays.copyOf(stored, stored.length);
        corrupted[100] ^= 1;
        Files.write(target, corrupted);
        assertThatThrownBy(() -> service.decryptFile(target, new ByteArrayOutputStream())).isInstanceOf(CryptoException.class);
    }

    @Test
    void missingConfigurationStopsStartup() {
        assertThatThrownBy(() -> new AesService(new LmsProperties())).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service.decryptFile(folder.resolve("none"), new ByteArrayOutputStream())).isInstanceOf(CryptoException.class);
    }

    @Test
    void converterDelegatesToService() {
        EncryptedStringConverter converter = new EncryptedStringConverter(service);
        assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn("x"))).isEqualTo("x");
    }
}
