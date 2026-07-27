/** Shadow Pokemon attack multiplier (applied to base Attack stat) */
export const SHADOW_ATK_MULTIPLIER = 6 / 5;

/** Shadow Pokemon defense multiplier (applied to base Defense stat) */
export const SHADOW_DEF_MULTIPLIER = 5 / 6;

/**
 * ER (Equivalent Rating) alpha parameter.
 * Controls the DPS vs TDO weighting: ER = DPS^α × TDO^(1-α)
 * Higher α → more DPS-weighted. Lower α → more TDO-weighted.
 * Default 0.75 is the community-standard value for "best attacker" rankings.
 */
export const ER_ALPHA = 0.75;
