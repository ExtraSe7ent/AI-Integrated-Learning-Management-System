package vn.edu.vju.lms.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class LmsPropertiesTest {

    @Test
    void aBlankZoneMeansThisMachinesZone() {
        LmsProperties properties = new LmsProperties();
        assertThat(properties.getTimeZone()).isEqualTo("Asia/Ho_Chi_Minh");
        properties.setTimeZone(" ");
        assertThat(properties.getTimeZone()).isEqualTo(ZoneId.systemDefault().getId());
        properties.setTimeZone(null);
        assertThat(properties.getTimeZone()).isEqualTo(ZoneId.systemDefault().getId());
    }
}
