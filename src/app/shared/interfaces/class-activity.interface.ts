import { StudentLevel } from './student-level.enum';

export type ActivityType = 'class' | 'event';
export type ActivityStatus = 'active' | 'draft' | 'completed';

export interface ClassActivity {
  id: string;
  name: string;
  type: ActivityType;
  level: StudentLevel | string;
  teacher: string;
  schedule: string;
  nextDate: string;
  room: string;
  attendees: number;
  capacity: number;
  status: ActivityStatus;
  color: 'violet' | 'blue' | 'amber' | 'rose' | 'emerald';
}
