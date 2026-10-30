package vn.edu.vju.lms.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Scores the three-question assignment template used by the frontend (4/3/3 points). Multiple choice and
 * fill-in are graded here; the essay stays at 0 until the lecturer sets its points, as in quiz_grading.py.
 */
public final class AssessmentGrader {

    public static final List<Double> MAX_POINTS = List.of(4.0, 3.0, 3.0);

    private AssessmentGrader() {
    }

    public static List<Double> grade(List<String> answers) {
        double first = "0".equals(answer(answers, 0)) ? MAX_POINTS.get(0) : 0;
        double second = "post".equals(TextNormalizer.forComparison(answer(answers, 1))) ? MAX_POINTS.get(1) : 0;
        return new ArrayList<>(List.of(first, second, 0.0));
    }

    public static double total(List<Double> points) {
        return Math.round(points.stream().mapToDouble(Double::doubleValue).sum() * 10) / 10.0;
    }

    private static String answer(List<String> answers, int index) {
        return index < answers.size() ? answers.get(index) : null;
    }
}
