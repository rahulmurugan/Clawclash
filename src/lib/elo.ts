const K = 32;

export function calculateElo(
  ratingA: number,
  ratingB: number,
  result: "A" | "B" | "DRAW"
): { newRatingA: number; newRatingB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  let scoreA: number;
  let scoreB: number;

  if (result === "A") {
    scoreA = 1;
    scoreB = 0;
  } else if (result === "B") {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = 0.5;
    scoreB = 0.5;
  }

  return {
    newRatingA: Math.round(ratingA + K * (scoreA - expectedA)),
    newRatingB: Math.round(ratingB + K * (scoreB - expectedB)),
  };
}
