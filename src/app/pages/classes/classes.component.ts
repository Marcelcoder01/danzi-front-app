import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendarDays,
  faClock,
  faEllipsis,
  faFilter,
  faMusic,
  faPlus,
  faSearch,
  faUsers,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

type ActivityType = 'class' | 'event';
type ActivityStatus = 'active' | 'draft' | 'completed';

interface ClassActivity {
  id: string;
  name: string;
  type: ActivityType;
  level: string;
  teacher: string;
  schedule: string;
  nextDate: string;
  room: string;
  attendees: number;
  capacity: number;
  status: ActivityStatus;
  color: 'violet' | 'blue' | 'amber' | 'rose' | 'emerald';
}

@Component({
  selector: 'app-classes',
  standalone: true,
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css',
  imports: [FormsModule, FaIconComponent]
})
export class ClassesComponent {
  faCalendarDays = faCalendarDays;
  faClock = faClock;
  faEllipsis = faEllipsis;
  faFilter = faFilter;
  faMusic = faMusic;
  faPlus = faPlus;
  faSearch = faSearch;
  faUsers = faUsers;
  faXmark = faXmark;

  isFiltersVisible = false;
  searchTerm = '';
  filterType = '';
  filterLevel = '';
  filterStatus = 'active';

  readonly allActivities: ClassActivity[] = [
    {
      id: 'salsa-inicial', name: 'Salsa Inicial', type: 'class', level: 'A1 · Inicial',
      teacher: 'Claudia Martín', schedule: 'Lunes y miércoles · 18:00', nextDate: 'Hoy, 18:00',
      room: 'Sala 1', attendees: 12, capacity: 14, status: 'active', color: 'violet'
    },
    {
      id: 'bachata-intermedio', name: 'Bachata Intermedio', type: 'class', level: 'B2 · Intermedio',
      teacher: 'Diego Herrera', schedule: 'Martes y jueves · 19:30', nextDate: 'Mañana, 19:30',
      room: 'Sala 2', attendees: 9, capacity: 12, status: 'active', color: 'blue'
    },
    {
      id: 'salsa-avanzado', name: 'Salsa Avanzado', type: 'class', level: 'C1 · Avanzado',
      teacher: 'Claudia Martín', schedule: 'Lunes y miércoles · 21:00', nextDate: 'Hoy, 21:00',
      room: 'Sala 1', attendees: 15, capacity: 15, status: 'active', color: 'rose'
    },
    {
      id: 'lady-style', name: 'Lady Style', type: 'class', level: 'Todos los niveles',
      teacher: 'Nerea López', schedule: 'Viernes · 18:30', nextDate: 'Vie, 18:30',
      room: 'Sala 3', attendees: 8, capacity: 14, status: 'active', color: 'amber'
    },
    {
      id: 'intensivo-musicalidad', name: 'Intensivo de musicalidad', type: 'event', level: 'B1–C2',
      teacher: 'Marcos Vidal', schedule: 'Sábado · 11:00–14:00', nextDate: '12 oct, 11:00',
      room: 'Sala 1', attendees: 18, capacity: 20, status: 'active', color: 'emerald'
    },
    {
      id: 'social-danzi', name: 'Social Danzi', type: 'event', level: 'Todos los niveles',
      teacher: 'Equipo Danzi', schedule: 'Sábado · 22:30–02:00', nextDate: '19 oct, 22:30',
      room: 'Sala principal', attendees: 42, capacity: 60, status: 'active', color: 'violet'
    },
    {
      id: 'urban-beginners', name: 'Urban Beginners', type: 'class', level: 'A1 · Inicial',
      teacher: 'Álex Ríos', schedule: 'Martes · 18:00', nextDate: 'Mañana, 18:00',
      room: 'Sala 3', attendees: 0, capacity: 12, status: 'draft', color: 'blue'
    },
    {
      id: 'workshop-latin-fusion', name: 'Workshop Latin Fusion', type: 'event', level: 'B2–C3',
      teacher: 'Invitado por confirmar', schedule: '9 nov · 17:00–20:00', nextDate: '9 nov, 17:00',
      room: 'Sala 2', attendees: 0, capacity: 25, status: 'draft', color: 'amber'
    }
  ];

  get activities(): ClassActivity[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.allActivities.filter(activity => {
      const matchesSearch = !search || [activity.name, activity.teacher, activity.room, activity.level]
        .some(value => value.toLowerCase().includes(search));
      const matchesType = !this.filterType || activity.type === this.filterType;
      const matchesLevel = !this.filterLevel || activity.level.startsWith(this.filterLevel);
      const matchesStatus = !this.filterStatus || activity.status === this.filterStatus;

      return matchesSearch && matchesType && matchesLevel && matchesStatus;
    });
  }

  toggleFilters(): void {
    this.isFiltersVisible = !this.isFiltersVisible;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.filterLevel = '';
    this.filterStatus = '';
  }

  getOccupancy(activity: ClassActivity): number {
    return Math.round((activity.attendees / activity.capacity) * 100);
  }

  getAvailabilityLabel(activity: ClassActivity): string {
    const remaining = activity.capacity - activity.attendees;
    if (activity.status === 'draft') return 'Sin publicar';
    if (remaining === 0) return 'Completa';
    if (remaining <= 3) return `${remaining} plazas`;
    return `${remaining} plazas libres`;
  }

  getAvailabilityClass(activity: ClassActivity): string {
    if (activity.status === 'draft') return 'badge-draft';
    if (activity.attendees === activity.capacity) return 'badge-full';
    if (activity.capacity - activity.attendees <= 3) return 'badge-limited';
    return 'badge-open';
  }
}
