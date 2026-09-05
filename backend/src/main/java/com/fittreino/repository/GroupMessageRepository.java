package com.fittreino.repository;

import com.fittreino.model.GroupMessageEntity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface GroupMessageRepository extends JpaRepository<GroupMessageEntity, String> {
    List<GroupMessageEntity> findByGroupIdOrderBySentAtAsc(String groupId);
    List<GroupMessageEntity> findByGroupIdOrderBySentAtDesc(String groupId, Pageable pageable);
    List<GroupMessageEntity> findByGroupIdAndSentAtBeforeOrderBySentAtDesc(String groupId, java.time.Instant before, Pageable pageable);
}