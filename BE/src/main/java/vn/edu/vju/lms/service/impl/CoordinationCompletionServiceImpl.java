package vn.edu.vju.lms.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vju.lms.common.exception.BusinessRuleException;
import vn.edu.vju.lms.dao.IChangeRequestDao;
import vn.edu.vju.lms.dao.ICoordinationCompletionDao;
import vn.edu.vju.lms.dao.ICoordinationItemDao;
import vn.edu.vju.lms.entity.CoordinationCompletion;
import vn.edu.vju.lms.entity.CoordinationItem;
import vn.edu.vju.lms.service.CoordinationCompletionService;

@Service
public class CoordinationCompletionServiceImpl implements CoordinationCompletionService {

    private static final List<String> REQUIRED_KINDS = List.of("slides", "quiz", "assignment");
    private static final int STANDARD_LEVEL = 3;

    private final ICoordinationCompletionDao completionDao;
    private final ICoordinationItemDao itemDao;
    private final IChangeRequestDao requestDao;

    public CoordinationCompletionServiceImpl(ICoordinationCompletionDao completionDao, ICoordinationItemDao itemDao,
            IChangeRequestDao requestDao) {
        this.completionDao = completionDao;
        this.itemDao = itemDao;
        this.requestDao = requestDao;
    }

    @Override
    @Transactional
    public void complete(String classId) {
        List<CoordinationItem> items = itemDao.findAll().stream()
                .filter(item -> classId.equals(item.getClassId())).toList();
        boolean complete = REQUIRED_KINDS.stream().allMatch(kind -> items.stream().anyMatch(i -> kind.equals(i.getKind())))
                && items.stream().allMatch(item -> Integer.valueOf(STANDARD_LEVEL).equals(item.getLevel()))
                && requestDao.findAll().stream().noneMatch(request -> !Boolean.TRUE.equals(request.getClosed())
                        && items.stream().anyMatch(item -> item.getId().equals(request.getItemId())));
        if (!complete) {
            throw new BusinessRuleException("Cần đủ slide, quiz và bài tập đạt M3, không còn yêu cầu mở.");
        }
        if (completionDao.findById(classId).isEmpty()) {
            completionDao.persist(new CoordinationCompletion(classId));
        }
    }

    @Override
    @Transactional
    public void reopen(String classId) {
        completionDao.findById(classId).ifPresent(completionDao::remove);
    }
}
