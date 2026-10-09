import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [FaIconComponent, DecimalPipe]
})
export class DashboardComponent implements OnInit {

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
  attendance = 0;
  monthlyIncome = 0;
  occupancy = 0;

  // Target values
  private readonly targetStudents = 42;
  private readonly targetClasses = 8;
  private readonly targetAttendance = 94;
  private readonly targetIncome = 3240;
  private readonly targetOccupancy = 78;

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

      this.totalStudents = Math.round(
        this.targetStudents * easedProgress
      );

      this.activeClasses = Math.round(
        this.targetClasses * easedProgress
      );

      this.attendance = Math.round(
        this.targetAttendance * easedProgress
      );

      this.monthlyIncome = Math.round(
        this.targetIncome * easedProgress
      );

      this.occupancy = Math.round(
        this.targetOccupancy * easedProgress
      );

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}