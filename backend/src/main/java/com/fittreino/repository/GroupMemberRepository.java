package com.fittreino.repository;

import com.fittreino.model.GroupMemberEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface GroupMemberRepository extends JpaRepository<GroupMemberEntity, String> {
    boolean existsByGroupIdAndUserId(String groupId, String userId);
    Optional<GroupMemberEntity> findByGroupIdAndUserId(String groupId, String userId);
    List<GroupMemberEntity> findAllByGroupIdOrderByJoinedAtAsc(String groupId);
    long countByGroupId(String groupId);
    void deleteByGroupIdAndUserId(String groupId, String userId);
    void deleteByGroupId(String groupId);
}