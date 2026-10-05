import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronRight, faChevronLeft, faBarsStaggered, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  @Output() menuClick = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  @Input() isCollapsed = false;

  faBars = faBars;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;

  faBarsStaggered = faBarsStaggered;
  faRightFromBracket = faRightFromBracket;
}
