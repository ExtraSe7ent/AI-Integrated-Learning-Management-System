package vn.edu.vju.lms.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.IntStream;
import vn.edu.vju.lms.entity.Assignment;

/**
 * UC-A03 AF-1 "ngẫu nhiên hóa": with the assignment's random flag on, each student gets their own fixed question
 * order. Everything is stored in the original order, so grading, the grade sheet and the lecturer's views are
 * unchanged; only what a student sends and receives is mapped. {@code order[i]} is the original index of the
 * question the student sees at position {@code i}.
 */
public final class ExamOrder {

    private ExamOrder() {
    }

    public static int[] of(Assignment assignment, String studentId) {
        int size = AssessmentGrader.questionsOf(assignment).size();
        List<Integer> order = new ArrayList<>(IntStream.range(0, size).boxed().toList());
        if (Boolean.TRUE.equals(assignment.getRandom())) {
            // Stable per student and assignment: reloading or a new attempt shows the same order.
            long seed = UUID.nameUUIDFromBytes((studentId + ":" + assignment.getId()).getBytes(StandardCharsets.UTF_8))
                    .getMostSignificantBits();
            Collections.shuffle(order, new Random(seed));
        }
        return order.stream().mapToInt(Integer::intValue).toArray();
    }

    public static boolean identity(int[] order) {
        return IntStream.range(0, order.length).allMatch(i -> order[i] == i);
    }

    /** Original order → the student's order. Lists of another length (old data) are returned unchanged. */
    public static <T> List<T> toStudent(List<T> original, int[] order) {
        if (original == null || original.size() != order.length || identity(order)) {
            return original;
        }
        List<T> shown = new ArrayList<>();
        for (int position : order) {
            shown.add(original.get(position));
        }
        return shown;
    }

    /** The student's order → original order. */
    public static <T> List<T> toOriginal(List<T> shown, int[] order) {
        if (shown == null || shown.size() != order.length || identity(order)) {
            return shown;
        }
        List<T> original = new ArrayList<>(Collections.nCopies(order.length, null));
        for (int i = 0; i < order.length; i++) {
            original.set(order[i], shown.get(i));
        }
        return original;
    }

    public static int originalIndex(int shownIndex, int[] order) {
        return shownIndex >= 0 && shownIndex < order.length ? order[shownIndex] : shownIndex;
    }

    public static int shownIndex(int originalIndex, int[] order) {
        for (int i = 0; i < order.length; i++) {
            if (order[i] == originalIndex) {
                return i;
            }
        }
        return originalIndex;
    }
}
