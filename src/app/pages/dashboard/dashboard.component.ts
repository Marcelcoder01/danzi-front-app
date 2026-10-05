import { Component } from '@angular/core';
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
  imports: [FaIconComponent]
})
export class DashboardComponent {
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
}
