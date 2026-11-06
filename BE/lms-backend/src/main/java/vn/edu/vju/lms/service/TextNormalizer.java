package vn.edu.vju.lms.service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** Vietnamese-aware text folding shared by grading, guardrails and keyword retrieval. */
public final class TextNormalizer {

    private TextNormalizer() {
    }

    /** Lowercases, turns đ into d and strips accents, like normalized() in rag_guardrails.py. */
    public static String fold(String text) {
        String lowered = text.toLowerCase(Locale.ROOT).replace('đ', 'd');
        return Normalizer.normalize(lowered, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    /** Fill-in comparison also ignores punctuation and spacing, like quiz_grading.py. */
    public static String forComparison(String text) {
        if (text == null) {
            return "";
        }
        return fold(text).replaceAll("[^\\p{L}\\p{N}_\\s]", " ").trim().replaceAll("\\s+", " ");
    }

    public static Set<String> tokens(String text) {
        return Arrays.stream(forComparison(text).split(" "))
                .filter(token -> token.length() > 1)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
