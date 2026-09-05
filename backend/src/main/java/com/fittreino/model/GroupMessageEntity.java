package com.fittreino.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Mensagem do chat privado do grupo. Mensagens do sistema (eventos de
 * competição) têm {@code userId} nulo e {@code isSystem = true}.
 */
@Entity
@Table(name = "group_messages")
public class GroupMessageEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private GroupEntity group;

    /** Nulo para mensagens automáticas do sistema. */
    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private String authorName;

    @Column(nullable = false, length = 1000)
    private String text;

    @Column(nullable = false)
    private boolean isSystem = false;

    @Column(nullable = false)
    private Instant sentAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public GroupEntity getGroup() { return group; }
    public void setGroup(GroupEntity group) { this.group = group; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean isSystem) { this.isSystem = isSystem; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}