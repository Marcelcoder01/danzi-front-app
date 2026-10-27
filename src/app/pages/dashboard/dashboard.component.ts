import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faUsers,
  faMusic,
  faUserCheck,
  faEuroSign,
  faArrowRight,
  faUserPlus,
  faCreditCard,
  faCalendarPlus,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { AcademyDataService } from '../../shared/services/academy-data.service';
import { AttendanceService } from '../attendance/services/attendance.service';
import { localDateKey } from '../attendance/interfaces/attendance.interface';
import type { Student } from '../../shared/interfaces/student.interface';
import { getPaymentPeriodMonths } from '../../shared/utils/payment-period.util';
import {
  ClassActivity,
  RegularClassActivity,
} from '../../shared/interfaces/class-activity.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [CommonModule, FaIconComponent, DecimalPipe],
})
export class DashboardComponent implements OnInit {
  private readonly academyData = inject(AcademyDataService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);

  faPlus = faPlus;
  faUsers = faUsers;
  faMusic = faMusic;
  faUserCheck = faUserCheck;
  faEuroSign = faEuroSign;
  faArrowRight = faArrowRight;
  faUserPlus = faUserPlus;
  faCreditCard = faCreditCard;
  faCalendarPlus = faCalendarPlus;
  faCircleInfo = faCircleInfo;

  // Animated values
  totalStudents = 0;
  activeClasses = 0;
  occupancy = 0;

  // Datos reales
  readonly allClasses = computed(() => {
    this.academyData.classesVersion();
    return [...this.academyData.classes];
  });
  readonly allStudents = computed(() => {
    this.academyData.studentsVersion();
    return [...this.academyData.students];
  });
  readonly paidStudentCount = computed(
    () => this.allStudents().filter((student) => student.hasPaid).length,
  );
  readonly monthlyIncome = computed(() =>
    this.allStudents()
      .filter((student) => student.hasPaid)
      .reduce(
        (total, student) =>
          total + Math.max(0, Number(student.monthlyFee ?? 40) || 0) * this.paymentMonths(student),
        0,
      ),
  );
  readonly currentMonth = localDateKey(new Date()).slice(0, 7);
  readonly attendanceStats = computed(() =>
    this.attendanceService.monthlyStats(
      this.currentMonth,
      this.attendanceService.studentsEnrolledDuring(this.currentMonth),
    ),
  );
  readonly attendance = computed(() => this.attendanceStats().attendanceRate);

  attendanceLabel(): string {
    const rate = this.attendance();
    if (!this.attendanceStats().expected) return 'Sin sesiones este mes';
    if (!this.attendanceStats().marked) return 'Sin listas pasadas';
    if (rate >= 90) return 'Excelente';
    if (rate >= 75) return 'Buen nivel';
    return 'Puede mejorar';
  }

  createClass(): void {
    void this.router.navigate(['/admin/classes'], { queryParams: { createClass: 'true' } });
  }

  readonly upcomingClasses = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.allClasses()
      .filter((activity) => {
        if (activity.status !== 'active') return false;

        if (activity.type === 'event') {
          // Para eventos únicos, verificar la fecha exacta
          const eventDate = new Date(`${activity.schedule.date}T12:00:00`);
          return (
            eventDate.getTime() === today.getTime() || eventDate.getTime() === tomorrow.getTime()
          );
        }

        if (activity.type === 'class') {
          return [today, tomorrow].some(
            (sessionDate) =>
              this.toLocalDateString(sessionDate) >= activity.startDate &&
              activity.schedule.weekdays.includes(sessionDate.getDay()),
          );
        }

        return false;
      })
      .map((activity) => {
        // Agregar información de si es hoy o mañana
        const isToday = this.isActivityToday(activity, today);
        return { ...activity, isToday };
      })
      .sort((a, b) => {
        // Ordenar: primero hoy, luego mañana, y por hora
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;

        const timeA = a.schedule.startTime.split(':').map(Number);
        const timeB = b.schedule.startTime.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
  });

  private isActivityToday(activity: ClassActivity, today: Date): boolean {
    if (activity.type === 'event') {
      const eventDate = new Date(`${activity.schedule.date}T12:00:00`);
      return eventDate.getTime() === today.getTime();
    }

    if (activity.type === 'class') {
      const todayWeekday = today.getDay();
      return (
        this.toLocalDateString(today) >= activity.startDate &&
        activity.schedule.weekdays.includes(todayWeekday)
      );
    }

    return false;
  }

  private toLocalDateString(date: Date): string {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
      .join('-');
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.animateDashboardNumbers();
  }

  private animateDashboardNumbers(): void {
    const duration = 1200;
    const start = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out: rápido al principio y suave al final
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      this.totalStudents = Math.round(this.allStudents().length * easedProgress);

      this.activeClasses = Math.round(
        this.allClasses().filter((c: ClassActivity) => c.type === 'class' && c.status === 'active')
          .length * easedProgress,
      );

      this.occupancy = Math.round(
        this.allClasses().length > 0
          ? (this.allClasses().reduce(
              (sum, c: ClassActivity) => sum + this.academyData.enrollmentCount(c.id),
              0,
            ) /
              this.allClasses().reduce((sum, c: ClassActivity) => sum + c.capacity, 0)) *
              100 *
              easedProgress
          : 0,
      );

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  getEnrollmentCount(activity: ClassActivity): number {
    return this.academyData.enrollmentCount(activity.id);
  }

  private paymentMonths(student: Student): number {
    return getPaymentPeriodMonths(student.paymentPeriod, student.paymentFrom, student.paymentTo);
  }

  getAvailabilityLabel(activity: ClassActivity): string {
    const remaining = activity.capacity - this.getEnrollmentCount(activity);
    if (remaining === 0) return 'Completa';
    if (remaining <= 3) return `${remaining} plazas`;
    return `${remaining} plazas libres`;
  }

  getAvailabilityClass(activity: ClassActivity): string {
    if (this.getEnrollmentCount(activity) === activity.capacity) return 'bg-red-50 text-red-700';
    if (activity.capacity - this.getEnrollmentCount(activity) <= 3)
      return 'bg-orange-50 text-orange-700';
    return 'bg-emerald-50 text-emerald-700';
  }
}
