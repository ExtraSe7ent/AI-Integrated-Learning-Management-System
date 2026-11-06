package vn.edu.vju.lms.ai;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;
import vn.edu.vju.lms.entity.RagChunk;
import vn.edu.vju.lms.service.TextNormalizer;

/** The provider-independent parts of rag.py: chunking, ranking, fusion and citation validation. */
public final class RagAlgorithms {

    public static final int RRF_K = 60;
    private static final int RANKING_SIZE = 20;
    private static final Pattern CITATION_IN_TEXT = Pattern.compile("\\[\\d");

    public record ValidatedAnswer(String answer, List<RagChunk> citations) {
    }

    private RagAlgorithms() {
    }

    public static List<String> passages(String raw, int maximum, int overlap) {
        String text = raw.replaceAll("[ \\t]+", " ").strip();
        List<String> result = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + maximum, text.length());
            if (end < text.length()) {
                int boundary = Math.max(lastIndex(text, "\n", start + maximum / 2, end), lastIndex(text, ". ", start + maximum / 2, end));
                if (boundary > start) {
                    end = boundary + 1;
                }
            }
            String piece = text.substring(start, end).strip();
            if (!piece.isEmpty()) {
                result.add(piece);
            }
            if (end == text.length()) {
                break;
            }
            start = Math.max(start + 1, end - overlap);
        }
        return result;
    }

    private static int lastIndex(String text, String needle, int from, int to) {
        int index = text.substring(0, to).lastIndexOf(needle);
        return index >= from ? index : -1;
    }

    public static double cosine(List<Double> a, List<Double> b) {
        if (a == null || b == null || a.isEmpty() || a.size() != b.size()) {
            return 0;
        }
        double dot = 0;
        double left = 0;
        double right = 0;
        for (int i = 0; i < a.size(); i++) {
            dot += a.get(i) * b.get(i);
            left += a.get(i) * a.get(i);
            right += b.get(i) * b.get(i);
        }
        double norm = Math.sqrt(left * right);
        return norm == 0 ? 0 : dot / norm;
    }

    public static List<RagChunk> vectorRanking(List<RagChunk> chunks, List<Double> query) {
        return chunks.stream()
                .sorted(Comparator.comparingDouble((RagChunk c) -> cosine(c.getEmbedding(), query)).reversed())
                .limit(RANKING_SIZE).toList();
    }

    public static List<RagChunk> keywordRanking(List<RagChunk> chunks, String query) {
        Set<String> terms = TextNormalizer.tokens(query);
        Map<RagChunk, Long> scores = new HashMap<>();
        for (RagChunk chunk : chunks) {
            Set<String> tokens = TextNormalizer.tokens(chunk.getText());
            scores.put(chunk, terms.stream().filter(tokens::contains).count());
        }
        return chunks.stream().filter(chunk -> scores.get(chunk) > 0)
                .sorted(Comparator.comparingLong((RagChunk c) -> scores.get(c)).reversed())
                .limit(RANKING_SIZE).toList();
    }

    /** Reciprocal Rank Fusion across every query's vector and keyword ranking. */
    public static List<RagChunk> fuse(List<List<RagChunk>> rankings) {
        Map<String, Double> scores = new HashMap<>();
        Map<String, RagChunk> lookup = new HashMap<>();
        for (List<RagChunk> ranking : rankings) {
            for (int rank = 0; rank < ranking.size(); rank++) {
                RagChunk chunk = ranking.get(rank);
                scores.merge(chunk.getChunkKey(), 1.0 / (RRF_K + rank + 1), Double::sum);
                lookup.put(chunk.getChunkKey(), chunk);
            }
        }
        return lookup.values().stream()
                .sorted(Comparator.comparingDouble((RagChunk c) -> scores.get(c.getChunkKey())).reversed())
                .limit(RANKING_SIZE).toList();
    }

    public static String guessTask(String question) {
        String text = TextNormalizer.fold(question);
        if (text.matches("(?s).*(tom tat|tong quan|summari[sz]e|summary|overview).*")) {
            return "summary";
        }
        if (text.matches("(?s).*(giang|giai thich|chi tiet|ky hon|ki hon|co che|hoat dong|nhu the nao|tai sao|vi sao|so sanh|phan tich|explain|in detail|how does|why).*")) {
            return "lecture";
        }
        return "lookup";
    }

    /** Adds neighbouring pages around retrieved chunks so explanations keep the lecture's flow. */
    public static List<RagChunk> expandContext(List<RagChunk> sources, List<RagChunk> candidates, int limit, int budget) {
        Map<String, List<RagChunk>> pages = new HashMap<>();
        candidates.forEach(c -> pages.computeIfAbsent(c.getVersionId() + ":" + c.getPage(), k -> new ArrayList<>()).add(c));
        List<RagChunk> picked = new ArrayList<>(sources);
        Set<String> seen = new HashSet<>(sources.stream().map(RagChunk::getChunkKey).toList());
        int total = sources.stream().mapToInt(c -> c.getText().length()).sum();
        for (RagChunk chunk : sources) {
            for (int page = chunk.getPage() - 1; page <= chunk.getPage() + 1; page++) {
                List<RagChunk> neighbours = new ArrayList<>(pages.getOrDefault(chunk.getVersionId() + ":" + page, List.of()));
                neighbours.sort(Comparator.comparing(RagChunk::getChunkKey));
                for (RagChunk neighbour : neighbours) {
                    if (!seen.contains(neighbour.getChunkKey()) && picked.size() < limit && total + neighbour.getText().length() <= budget) {
                        seen.add(neighbour.getChunkKey());
                        picked.add(neighbour);
                        total += neighbour.getText().length();
                    }
                }
            }
        }
        picked.sort(Comparator.comparing(RagChunk::getVersionId).thenComparingInt(RagChunk::getPage).thenComparing(RagChunk::getChunkKey));
        return picked;
    }

    /** Backend-owned citations: every block must cite real markers, otherwise nothing is shown as sourced. */
    public static ValidatedAnswer validateAnswer(JsonNode value, List<RagChunk> sources) {
        ValidatedAnswer empty = new ValidatedAnswer("", List.of());
        JsonNode blocks = value.path("blocks");
        if (!value.path("supported").asBoolean(false) || !blocks.isArray() || blocks.isEmpty() || blocks.size() > 30) {
            return empty;
        }
        Set<Integer> used = new TreeSet<>();
        List<String> paragraphs = new ArrayList<>();
        for (JsonNode block : blocks) {
            String text = block.path("text").asText("");
            JsonNode ids = block.path("source_ids");
            if (text.isBlank() || !ids.isArray() || ids.isEmpty() || CITATION_IN_TEXT.matcher(text).find()) {
                return empty;
            }
            Set<Integer> markers = new TreeSet<>();
            for (JsonNode id : ids) {
                if (!id.isInt() || id.asInt() < 1 || id.asInt() > sources.size()) {
                    return empty;
                }
                markers.add(id.asInt());
            }
            used.addAll(markers);
            StringBuilder paragraph = new StringBuilder(text.strip()).append(' ');
            markers.forEach(marker -> paragraph.append('[').append(marker).append(']'));
            paragraphs.add(paragraph.toString());
        }
        return new ValidatedAnswer(String.join("\n\n", paragraphs), used.stream().map(i -> sources.get(i - 1)).toList());
    }

    public static List<Map<String, Object>> evidence(List<RagChunk> sources) {
        List<Map<String, Object>> evidence = new ArrayList<>();
        for (int i = 0; i < sources.size(); i++) {
            RagChunk source = sources.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("marker", i + 1);
            item.put("text", source.getText());
            item.put("title", source.getMaterialTitle());
            item.put("chunk_id", source.getChunkKey());
            item.put("page", source.getPage());
            evidence.add(item);
        }
        return evidence;
    }
}
