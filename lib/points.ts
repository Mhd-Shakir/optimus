export const calculateGradeAndPoints = (mark: number, isGroup: boolean) => {
  if (typeof mark !== 'number' || isNaN(mark)) return { grade: null, points: 0 };

  if (isGroup) {
    if (mark >= 90 && mark <= 100) return { grade: 'A+', points: 25 };
    if (mark >= 80 && mark <= 89) return { grade: 'A', points: 20 };
    if (mark >= 71 && mark <= 79) return { grade: 'A', points: 18 };
    if (mark >= 65 && mark <= 70) return { grade: 'B', points: 15 };
    if (mark >= 60 && mark <= 64) return { grade: 'B', points: 14 };
    if (mark >= 45 && mark <= 59) return { grade: 'B', points: 13 };
    if (mark >= 41 && mark <= 44) return { grade: 'B', points: 12 };
    if (mark >= 25 && mark <= 40) return { grade: 'C', points: 9 };
    return { grade: null, points: 0 };
  } else {
    if (mark >= 90 && mark <= 100) return { grade: 'A+', points: 11 };
    if (mark >= 81 && mark <= 89) return { grade: 'A', points: 10 };
    if (mark >= 70 && mark <= 80) return { grade: 'A', points: 9 };
    if (mark >= 61 && mark <= 69) return { grade: 'B', points: 6 };
    if (mark >= 51 && mark <= 60) return { grade: 'B', points: 5 };
    if (mark >= 41 && mark <= 50) return { grade: 'B', points: 4 };
    if (mark >= 31 && mark <= 40) return { grade: 'C', points: 3 };
    if (mark >= 26 && mark <= 30) return { grade: 'C', points: 2 };
    if (mark >= 15 && mark <= 25) return { grade: 'C', points: 1 };
    return { grade: null, points: 0 };
  }
};
