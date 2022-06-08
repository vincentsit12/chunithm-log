export function calculateSingleSongRating(rate: number, score: number): number {

    if (!rate || !score) return 0
    if (score >= 1009000) return rate + 2.15
    if (score >= 1007500) return rate + 2 + (score - 1007500) / 1500 * .1
    if (score >= 1005000) return (score - 1005000) / 2500 * 0.5 + 1.5 + rate;
    if (score >= 1000000) return (score - 1000000) / 5000 * 0.5 + 1 + rate;
    if (score >= 975000) return (score - 975000) / 25000 + rate;

    return 0
}


