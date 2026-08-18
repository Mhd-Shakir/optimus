export const calculateGradeAndPoints = (mark: number, isGroup: boolean) => {
  if (typeof mark !== 'number' || isNaN(mark)) return { grade: null, points: 0 };

  if (isGroup) {
    if (mark >= 91 && mark <= 100) return { grade: 'A+', points: 25 };
    if (mark >= 86 && mark <= 90) return { grade: 'A', points: 20 };
    if (mark >= 81 && mark <= 85) return { grade: 'A', points: 18 };
    if (mark >= 76 && mark <= 80) return { grade: 'A', points: 15 };
    if (mark >= 71 && mark <= 75) return { grade: 'B', points: 14 };
    if (mark >= 66 && mark <= 70) return { grade: 'B', points: 12 };
    if (mark >= 61 && mark <= 65) return { grade: 'B', points: 11 };
    if (mark >= 51 && mark <= 60) return { grade: 'B', points: 10 };
    if (mark >= 41 && mark <= 50) return { grade: 'C', points: 8 };
    if (mark >= 31 && mark <= 40) return { grade: 'C', points: 7 };
    if (mark >= 21 && mark <= 30) return { grade: 'C', points: 3 };
    return { grade: null, points: 0 };
  } else {
    if (mark >= 91 && mark <= 100) return { grade: 'A+', points: 11 };
    if (mark >= 86 && mark <= 90) return { grade: 'A', points: 10 };
    if (mark >= 81 && mark <= 85) return { grade: 'A', points: 9 };
    if (mark >= 76 && mark <= 80) return { grade: 'A', points: 8 };
    if (mark >= 71 && mark <= 75) return { grade: 'B', points: 7 };
    if (mark >= 66 && mark <= 70) return { grade: 'B', points: 6 };
    if (mark >= 61 && mark <= 65) return { grade: 'B', points: 5 };
    if (mark >= 51 && mark <= 60) return { grade: 'B', points: 4 };
    if (mark >= 41 && mark <= 50) return { grade: 'C', points: 3 };
    if (mark >= 31 && mark <= 40) return { grade: 'C', points: 2 };
    if (mark >= 21 && mark <= 30) return { grade: 'C', points: 1 };
    return { grade: null, points: 0 };
  }
};

export const getPositionPoints = (position: string | null | undefined, isGroup: boolean) => {
  if (!position) return 0;
  const norm = position.toLowerCase();
  
  if (isGroup) {
    if (norm === 'first') return 10;
    if (norm === 'second') return 6;
    if (norm === 'third') return 3;
  } else {
    if (norm === 'first') return 5;
    if (norm === 'second') return 3;
    if (norm === 'third') return 1;
  }
  return 0;
};

export const calculateTotalPoints = (mark: number, position: string | null | undefined, isGroup: boolean) => {
  const { grade, points: gradePoints } = calculateGradeAndPoints(mark, isGroup);
  const positionPoints = getPositionPoints(position, isGroup);
  
  return {
    grade,
    gradePoints,
    positionPoints,
    points: gradePoints + positionPoints
  };
};
