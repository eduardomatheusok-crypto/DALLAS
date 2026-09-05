package com.fittreino.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/**
 * Participante de uma competição. Guarda a pontuação calculada (derivada dos
 * logs reais de treino) e os campos de rastreio usados para gerar eventos no
 * chat com moderação.
 */
@Entity
@Table(name = "competition_participants", uniqueConstraints = @UniqueConstraint(columnNames = {"competition_id", "user_id"}))
public class CompetitionParticipantEntity {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private CompetitionEntity competition;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private Instant joinedAt;

    // --- Pontuação calculada ---
    @Column(nullable = false)
    private double progressionScore = 0;

    @Column(nullable = false)
    private double consistencyScore = 0;

    @Column(nullable = false)
    private double volumeScore = 0;

    @Column(nullable = false)
    private double goalsScore = 0;

    @Column(nullable = false)
    private double totalScore = 0;

    @Column(nullable = false)
    private int position = 0;

    // --- Métricas derivadas exibidas no ranking ---
    @Column(nullable = false)
    private double progressPct = 0;

    @Column(nullable = false)
    private int trainedDays = 0;

    @Column(nullable = false)
    private double totalVolume = 0;

    @Column(nullable = false)
    private int prCount = 0;

    // --- Rastreio para eventos (moderação do chat) ---
    @Column(nullable = false)
    private int lastPosition = 0;

    @Column(nullable = false)
    private double lastProgressionPct = 0;

    @Column(nullable = false)
    private int lastStreakDays = 0;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public CompetitionEntity getCompetition() { return competition; }
    public void setCompetition(CompetitionEntity competition) { this.competition = competition; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public double getProgressionScore() { return progressionScore; }
    public void setProgressionScore(double v) { this.progressionScore = v; }

    public double getConsistencyScore() { return consistencyScore; }
    public void setConsistencyScore(double v) { this.consistencyScore = v; }

    public double getVolumeScore() { return volumeScore; }
    public void setVolumeScore(double v) { this.volumeScore = v; }

    public double getGoalsScore() { return goalsScore; }
    public void setGoalsScore(double v) { this.goalsScore = v; }

    public double getTotalScore() { return totalScore; }
    public void setTotalScore(double v) { this.totalScore = v; }

    public int getPosition() { return position; }
    public void setPosition(int v) { this.position = v; }

    public double getProgressPct() { return progressPct; }
    public void setProgressPct(double v) { this.progressPct = v; }

    public int getTrainedDays() { return trainedDays; }
    public void setTrainedDays(int v) { this.trainedDays = v; }

    public double getTotalVolume() { return totalVolume; }
    public void setTotalVolume(double v) { this.totalVolume = v; }

    public int getPrCount() { return prCount; }
    public void setPrCount(int v) { this.prCount = v; }

    public int getLastPosition() { return lastPosition; }
    public void setLastPosition(int v) { this.lastPosition = v; }

    public double getLastProgressionPct() { return lastProgressionPct; }
    public void setLastProgressionPct(double v) { this.lastProgressionPct = v; }

    public int getLastStreakDays() { return lastStreakDays; }
    public void setLastStreakDays(int v) { this.lastStreakDays = v; }
}