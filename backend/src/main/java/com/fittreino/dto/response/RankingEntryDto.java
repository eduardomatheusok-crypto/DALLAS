package com.fittreino.dto.response;

import com.fittreino.model.CompetitionParticipantEntity;

public record RankingEntryDto(
        UserDto user,
        int position,
        double totalScore,
        double progressionScore,
        double consistencyScore,
        double volumeScore,
        double goalsScore,
        RankingStatsDto stats
) {
    public static RankingEntryDto from(CompetitionParticipantEntity p, UserDto user) {
        return new RankingEntryDto(
                user,
                p.getPosition(),
                p.getTotalScore(),
                p.getProgressionScore(),
                p.getConsistencyScore(),
                p.getVolumeScore(),
                p.getGoalsScore(),
                new RankingStatsDto(
                        p.getProgressPct(),
                        p.getTrainedDays(),
                        p.getTotalVolume(),
                        p.getPrCount()
                )
        );
    }
}