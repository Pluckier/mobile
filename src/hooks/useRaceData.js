export const isHorseNR = (horse) => {
  if (!horse) return false;
  if (horse.number === 'NR' || horse.status === 'NR') return true;
  const odds = horse.odds || [];
  if (odds.length > 0) {
    const last = odds[odds.length - 1];
    return last === 'NR' || last === 'null' || last === 'Non-Runner';
  }
  return false;
};

export const getAverageRating = (horse) => {
  const runs = (horse?.past || []).slice(0, 3);
  if (runs.length === 0) return 0;
  const validRatings = runs
    .map((r) => parseFloat(r?.name))
    .filter((val) => !isNaN(val) && val > 0);
  if (validRatings.length === 0) return 0;
  const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
  return sum / validRatings.length;
};

export const sortHorses = (horses = []) => {
  return [...horses].sort((a, b) => {
    const isNRA = isHorseNR(a);
    const isNRB = isHorseNR(b);

    if (isNRA !== isNRB) {
      return isNRA ? 1 : -1;
    }

    const ratingA = getAverageRating(a);
    const ratingB = getAverageRating(b);
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    const numA = parseInt(a.number, 10) || 999;
    const numB = parseInt(b.number, 10) || 999;
    return numA - numB;
  });
};

