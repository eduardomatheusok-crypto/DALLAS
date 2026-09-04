package com.fittreino.workoutlog;

public enum SetType {
    NORMAL("normal", "Válida"),
    DROP("drop", "Drop set"),
    BACKOFF("backoff", "Back-off"),
    MYO("myo", "Myo reps"),
    CLUSTER("cluster", "Cluster set"),
    BISET("biset", "Bisset"),
    GIANT("giant", "Giant set"),
    SUPERSET("superset", "Superset"),
    FORCADA("forcada", "Forçada"),
    PARCIAL("parcial", "Parcial");

    private final String code;
    private final String label;

    SetType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static SetType fromCode(String code) {
        if (code == null || code.isBlank()) return NORMAL;
        for (SetType t : values()) {
            if (t.code.equalsIgnoreCase(code)) return t;
        }
        return NORMAL;
    }
}
