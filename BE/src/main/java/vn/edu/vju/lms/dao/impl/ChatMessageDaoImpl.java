package vn.edu.vju.lms.dao.impl;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IChatMessageDao;
import vn.edu.vju.lms.entity.ChatMessage;

@Repository
public class ChatMessageDaoImpl extends HibernateGenericDao<String, ChatMessage> implements IChatMessageDao {

    public ChatMessageDaoImpl() {
        super(ChatMessage.class);
    }

    @Override
    public List<ChatMessage> findByOwner(String ownerId) {
        return list("SELECT m FROM ChatMessage m WHERE m.ownerId = :ownerId ORDER BY m.createdAt", Map.of("ownerId", ownerId));
    }

    @Override
    public long countSince(String ownerId, Instant since) {
        return entityManager.createQuery(
                "SELECT COUNT(m) FROM ChatMessage m WHERE m.ownerId = :ownerId AND m.createdAt >= :since", Long.class)
                .setParameter("ownerId", ownerId)
                .setParameter("since", since)
                .getSingleResult();
    }
}
