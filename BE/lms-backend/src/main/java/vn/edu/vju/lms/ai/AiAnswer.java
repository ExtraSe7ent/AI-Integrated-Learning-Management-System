package vn.edu.vju.lms.ai;

import java.util.List;

public record AiAnswer(String answer, int page, List<Integer> sources, String mode) {

    public static AiAnswer withoutSources(String answer, String mode) {
        return new AiAnswer(answer, 0, List.of(), mode);
    }
}
