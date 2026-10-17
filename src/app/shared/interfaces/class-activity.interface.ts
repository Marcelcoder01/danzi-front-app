import { StudentLevel } from './student-level.enum';

export type ActivityType = 'class' | 'event';
export type ActivityStatus = 'active' | 'draft' | 'completed';
export type ActivityColor = 'violet' | 'blue' | 'amber' | 'rose' | 'emerald';

export interface WeeklyClassSchedule {
  weekdays: number[];
  startTime: string;
  endTime: string;
}

export interface OneOffSchedule {
  date: string;
  startTime: string;
  endTime: string;
}

interface ActivityBase {
  id: string;
  name: string;
  level: StudentLevel | string;
  teacher: string;
  room: string;
  capacity: number;
  status: ActivityStatus;
  color: ActivityColor;
}

export interface RegularClassActivity extends ActivityBase {
  type: 'class';
  schedule: WeeklyClassSchedule;
}

export interface EventActivity extends ActivityBase {
  type: 'event';
  schedule: OneOffSchedule;
}

export type ClassActivity = RegularClassActivity | EventActivity;
