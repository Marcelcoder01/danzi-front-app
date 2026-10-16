import { StudentLevel } from '../../../shared/interfaces/student-level.enum';
import { AttendanceClass, AttendanceStudent } from '../interfaces/attendance.interface';

export const ATTENDANCE_CLASSES: AttendanceClass[] = [
  {
    id: 'salsa-b2',
    name: 'Salsa Intermedio',
    level: StudentLevel.B2,
    weekdays: [1, 3],
    time: '19:00 – 20:00',
    room: 'Sala 1',
  },
  {
    id: 'bachata-b2',
    name: 'Bachata Intermedio',
    level: StudentLevel.B2,
    weekdays: [2, 4],
    time: '19:00 – 20:00',
    room: 'Sala 2',
  },
  {
    id: 'bachata-a1',
    name: 'Bachata Inicial',
    level: StudentLevel.A1,
    weekdays: [2, 4],
    time: '18:00 – 19:00',
    room: 'Sala 2',
  },
  {
    id: 'kizomba-c1',
    name: 'Kizomba Avanzado',
    level: StudentLevel.C1,
    weekdays: [3, 5],
    time: '20:00 – 21:00',
    room: 'Sala 3',
  },
];

const names = [
  ['Ana', 'Torres', 'salsa-b2', StudentLevel.B2],
  ['Carlos', 'Díaz', 'salsa-b2', StudentLevel.B2],
  ['Lucía', 'Martín', 'salsa-b2', StudentLevel.B2],
  ['Mateo', 'Ruiz', 'salsa-b2', StudentLevel.B2],
  ['Sofía', 'García', 'salsa-b2', StudentLevel.B2],
  ['Daniel', 'López', 'salsa-b2', StudentLevel.B2],
  ['Valeria', 'López', 'salsa-b2', StudentLevel.B2],
  ['Bruno', 'Castro', 'salsa-b2', StudentLevel.B2],
  ['Elena', 'Rodríguez', 'bachata-b2', StudentLevel.B2],
  ['Miguel', 'González', 'bachata-b2', StudentLevel.B2],
  ['María', 'López', 'bachata-a1', StudentLevel.A1],
  ['David', 'Fernández', 'bachata-a1', StudentLevel.A1],
  ['Laura', 'García', 'kizomba-c1', StudentLevel.C1],
  ['Pedro', 'Martínez', 'kizomba-c1', StudentLevel.C1],
] as const;

export const ATTENDANCE_STUDENTS: AttendanceStudent[] = names.map((name, index) => ({
  id: `demo-${index + 1}`,
  firstName: name[0],
  lastName: name[1],
  classId: name[2],
  level: name[3],
  status: 'active',
  role: index % 2 ? 'leader' : 'follower',
  hasPaid: true,
  startDate: '2026-09-01',
  avatarColor: ['lilac', 'peach', 'mint', 'sky'][index % 4],
}));
