package com.fittreino.dto.response;

public record RankingStatsDto(
        double progressPct,
        int trainedDays,
        double totalVolume,
        int prCount
) {}