package vn.edu.vju.lms.ai;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.context.ApplicationEventPublisher;

/** Indexing can take minutes, so it runs off the request thread, after the "queued" state is committed. */
@Component
public class RagIndexJob {

    public record IndexRequested(String materialId) {
    }

    private final ApplicationEventPublisher events;
    private final RagIndexer indexer;

    public RagIndexJob(ApplicationEventPublisher events, RagIndexer indexer) {
        this.events = events;
        this.indexer = indexer;
    }

    public void enqueueAfterCommit(String materialId) {
        events.publishEvent(new IndexRequested(materialId));
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onIndexRequested(IndexRequested event) {
        indexer.index(event.materialId());
    }
}
