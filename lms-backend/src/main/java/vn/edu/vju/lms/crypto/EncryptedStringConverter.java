package vn.edu.vju.lms.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/** Transparent column encryption: plain text in the entity, AES-GCM ciphertext in the database. */
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final AesService aesService;

    public EncryptedStringConverter(AesService aesService) {
        this.aesService = aesService;
    }

    @Override
    public String convertToDatabaseColumn(String value) {
        return aesService.encrypt(value);
    }

    @Override
    public String convertToEntityAttribute(String value) {
        return aesService.decrypt(value);
    }
}
