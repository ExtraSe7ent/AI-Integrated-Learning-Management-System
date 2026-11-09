package vn.edu.vju.lms.crypto;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.Mac;
import javax.crypto.SealedObject;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.edu.vju.lms.config.LmsProperties;

/**
 * AES-256-GCM for user data and documents. The key is derived with PBKDF2 from a passphrase kept outside
 * the database, and each value gets a fresh random IV. Files are split into chunks so a 500 MB video does
 * not have to fit in memory (Java buffers a whole GCM message when decrypting).
 */
@Service
public class AesService {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final int KEY_BITS = 256;
    private static final int FILE_CHUNK_BYTES = 1024 * 1024;

    private final SecureRandom random = new SecureRandom();
    private final SecretKey key;
    private final SecretKey hmacKey;

    public AesService(LmsProperties properties) throws GeneralSecurityException {
        LmsProperties.Crypto crypto = properties.getCrypto();
        if (!StringUtils.hasText(crypto.getPassphrase()) || !StringUtils.hasText(crypto.getSalt())) {
            throw new IllegalStateException("Cần cấu hình LMS_AES_PASSPHRASE và LMS_AES_SALT.");
        }
        byte[] salt = crypto.getSalt().getBytes(StandardCharsets.UTF_8);
        this.key = deriveKey(crypto.getPassphrase(), salt, crypto.getIterations());
        // A separate key, so the lookup hash reveals nothing about the encryption key.
        this.hmacKey = deriveKey(crypto.getPassphrase() + ":hmac", salt, crypto.getIterations());
    }

    public static SecretKey generateKey() throws NoSuchAlgorithmException {
        KeyGenerator generator = KeyGenerator.getInstance("AES");
        generator.init(KEY_BITS);
        return generator.generateKey();
    }

    public static SecretKey deriveKey(String passphrase, byte[] salt, int iterations)
            throws NoSuchAlgorithmException, InvalidKeySpecException {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        PBEKeySpec spec = new PBEKeySpec(passphrase.toCharArray(), salt, iterations, KEY_BITS);
        return new SecretKeySpec(factory.generateSecret(spec).getEncoded(), "AES");
    }

    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }
        try {
            byte[] iv = randomIv();
            byte[] cipherText = cipher(Cipher.ENCRYPT_MODE, iv).doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(
                    ByteBuffer.allocate(iv.length + cipherText.length).put(iv).put(cipherText).array());
        } catch (GeneralSecurityException e) {
            throw new CryptoException("Không mã hóa được dữ liệu.", e);
        }
    }

    public String decrypt(String encoded) {
        if (encoded == null) {
            return null;
        }
        try {
            byte[] packed = Base64.getDecoder().decode(encoded);
            byte[] iv = new byte[IV_BYTES];
            System.arraycopy(packed, 0, iv, 0, IV_BYTES);
            byte[] plain = cipher(Cipher.DECRYPT_MODE, iv).doFinal(packed, IV_BYTES, packed.length - IV_BYTES);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException | IndexOutOfBoundsException e) {
            throw new CryptoException("Không giải mã được dữ liệu.", e);
        }
    }

    /** Deterministic keyed hash for looking up and de-duplicating encrypted values such as email. */
    public String blindIndex(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacKey.getEncoded(), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new CryptoException("Không tạo được chỉ mục.", e);
        }
    }

    public SealedObject seal(java.io.Serializable value) {
        try {
            return new SealedObject(value, cipher(Cipher.ENCRYPT_MODE, randomIv()));
        } catch (GeneralSecurityException | IOException e) {
            throw new CryptoException("Không mã hóa được đối tượng.", e);
        }
    }

    public Object unseal(SealedObject sealed) {
        try {
            return sealed.getObject(key);
        } catch (GeneralSecurityException | IOException | ClassNotFoundException e) {
            throw new CryptoException("Không giải mã được đối tượng.", e);
        }
    }

    public void encryptFile(InputStream source, Path target) {
        try (OutputStream out = Files.newOutputStream(target)) {
            encryptStream(source, out);
        } catch (IOException | GeneralSecurityException e) {
            throw new CryptoException("Không mã hóa được tệp.", e);
        }
    }

    public void decryptFile(Path source, OutputStream target) {
        try (InputStream in = Files.newInputStream(source)) {
            decryptStream(in, target);
        } catch (IOException | GeneralSecurityException e) {
            throw new CryptoException("Không giải mã được tệp.", e);
        }
    }

    private void encryptStream(InputStream in, OutputStream out) throws IOException, GeneralSecurityException {
        byte[] buffer = new byte[FILE_CHUNK_BYTES];
        long chunk = 0;
        int length;
        while ((length = in.readNBytes(buffer, 0, buffer.length)) > 0) {
            byte[] iv = randomIv();
            Cipher cipher = cipher(Cipher.ENCRYPT_MODE, iv);
            cipher.updateAAD(ByteBuffer.allocate(Long.BYTES).putLong(chunk++).array());
            byte[] cipherText = cipher.doFinal(buffer, 0, length);
            out.write(ByteBuffer.allocate(Integer.BYTES).putInt(cipherText.length).array());
            out.write(iv);
            out.write(cipherText);
        }
    }

    private void decryptStream(InputStream in, OutputStream out) throws IOException, GeneralSecurityException {
        long chunk = 0;
        byte[] header;
        while ((header = in.readNBytes(Integer.BYTES)).length == Integer.BYTES) {
            int length = ByteBuffer.wrap(header).getInt();
            byte[] iv = in.readNBytes(IV_BYTES);
            byte[] cipherText = in.readNBytes(length);
            Cipher cipher = cipher(Cipher.DECRYPT_MODE, iv);
            // The chunk index is authenticated, so reordering chunks makes decryption fail.
            cipher.updateAAD(ByteBuffer.allocate(Long.BYTES).putLong(chunk++).array());
            out.write(cipher.doFinal(cipherText));
        }
    }

    private Cipher cipher(int mode, byte[] iv) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(mode, key, new GCMParameterSpec(TAG_BITS, iv));
        return cipher;
    }

    private byte[] randomIv() {
        byte[] iv = new byte[IV_BYTES];
        random.nextBytes(iv);
        return iv;
    }
}
