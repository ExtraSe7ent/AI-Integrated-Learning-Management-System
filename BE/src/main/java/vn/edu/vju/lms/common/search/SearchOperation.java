package vn.edu.vju.lms.common.search;

public enum SearchOperation {
    EQUALITY, NEGATION, GREATER_THAN, LESS_THAN, LIKE;

    public static SearchOperation fromSymbol(char symbol) {
        return switch (symbol) {
            case ':' -> EQUALITY;
            case '!' -> NEGATION;
            case '>' -> GREATER_THAN;
            case '<' -> LESS_THAN;
            case '~' -> LIKE;
            default -> throw new IllegalArgumentException("Toán tử tìm kiếm không hợp lệ: " + symbol);
        };
    }
}
