package vn.edu.vju.lms.dao;

import java.time.Instant;
import java.util.List;
import vn.edu.vju.lms.common.dao.IGenericDao;
import vn.edu.vju.lms.entity.ChatMessage;

public interface IChatMessageDao extends IGenericDao<String, ChatMessage> {

    List<ChatMessage> findByOwner(String ownerId);

    long countSince(String ownerId, Instant since);
}
