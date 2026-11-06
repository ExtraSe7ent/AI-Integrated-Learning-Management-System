package vn.edu.vju.lms.common.web;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

/** Builds a Pageable from page/size plus a "field,asc;other,desc" sort parameter. */
public final class PageRequests {

    private static final int MAX_SIZE = 200;

    private PageRequests() {
    }

    public static Pageable of(int page, int size, String sort) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_SIZE), parseSort(sort));
    }

    static Sort parseSort(String sort) {
        if (!StringUtils.hasText(sort)) {
            return Sort.unsorted();
        }
        Sort result = Sort.unsorted();
        for (String part : sort.split(";")) {
            String[] pieces = part.trim().split(",");
            Sort.Direction direction = pieces.length > 1 && "desc".equalsIgnoreCase(pieces[1].trim())
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            result = result.and(Sort.by(direction, pieces[0].trim()));
        }
        return result;
    }
}
