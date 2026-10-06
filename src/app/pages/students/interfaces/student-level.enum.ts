export enum StudentLevel {
  A1 = 'A1',
  A2 = 'A2',
  A3 = 'A3',
  B1 = 'B1',
  B2 = 'B2',
  B3 = 'B3',
  C1 = 'C1',
  C2 = 'C2',
  C3 = 'C3',
}

 export function getLevelLabel(level: StudentLevel): string {
    const levelMap: Record<StudentLevel, string> = {
      [StudentLevel.A1]: 'Principiante A1',
      [StudentLevel.A2]: 'Principiante A2',
      [StudentLevel.A3]: 'Principiante A3',
      [StudentLevel.B1]: 'Intermedio B1',
      [StudentLevel.B2]: 'Intermedio B2',
      [StudentLevel.B3]: 'Intermedio B3',
      [StudentLevel.C1]: 'Avanzado C1',
      [StudentLevel.C2]: 'Avanzado C2',
      [StudentLevel.C3]: 'Avanzado C3'
    };
    return levelMap[level] || level;
  }
