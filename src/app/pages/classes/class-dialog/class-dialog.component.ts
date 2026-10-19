import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faMusic, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  ActivityColor,
  ActivityStatus,
  RegularClassActivity,
} from '../../../shared/interfaces/class-activity.interface';
import { StudentLevel, getLevelLabel } from '../../../shared/interfaces/student-level.enum';
import { ToastService } from '../../../shared/services/toast.service';

type NewClassActivity = Omit<RegularClassActivity, 'id'>;

@Component({
  selector: 'app-class-dialog',
  standalone: true,
  templateUrl: './class-dialog.component.html',
  imports: [FormsModule, FaIconComponent],
})
export class ClassDialogComponent {
  private readonly toastService = inject(ToastService);

  @Output() createClass = new EventEmitter<NewClassActivity>();
  @Output() updateClass = new EventEmitter<RegularClassActivity>();

  readonly faArrowRight = faArrowRight;
  readonly faMusic = faMusic;
  readonly faXmark = faXmark;
  readonly levels = Object.values(StudentLevel);
  readonly weekdays = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
  ];
  readonly colors: { value: ActivityColor; label: string }[] = [
    { value: 'violet', label: 'Violeta' },
    { value: 'blue', label: 'Azul' },
    { value: 'amber', label: 'Ámbar' },
    { value: 'rose', label: 'Rosa' },
    { value: 'emerald', label: 'Verde' },
  ];
  readonly statuses: { value: ActivityStatus; label: string }[] = [
    { value: 'active', label: 'Activa y publicada' },
    { value: 'draft', label: 'Borrador' },
  ];
  readonly levelLabel = getLevelLabel;
  weekdaysError = false;
  isEdit = false;
  private editingClassId: string | null = null;

  newClass: NewClassActivity = this.createEmptyClass();

  toggleWeekday(day: number): void {
    const selected = this.newClass.schedule.weekdays;
    this.newClass.schedule.weekdays = selected.includes(day)
      ? selected.filter((weekday) => weekday !== day)
      : [...selected, day].sort((a, b) => a - b);
    this.weekdaysError = false;
  }

  onSubmit(): void {
    if (!this.newClass.schedule.weekdays.length) {
      this.weekdaysError = true;
      this.toastService.warning('Selecciona al menos un día para la clase.');
      return;
    }

    if (this.newClass.schedule.endTime <= this.newClass.schedule.startTime) {
      this.toastService.warning('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const activity = {
      ...this.newClass,
      schedule: { ...this.newClass.schedule, weekdays: [...this.newClass.schedule.weekdays] },
    };
    if (this.isEdit && this.editingClassId) {
      this.updateClass.emit({ ...activity, id: this.editingClassId });
    } else {
      this.createClass.emit(activity);
    }
    this.closeDialog();
    this.newClass = this.createEmptyClass();
    this.isEdit = false;
    this.editingClassId = null;
  }

  openForCreate(): void {
    this.newClass = this.createEmptyClass();
    this.isEdit = false;
    this.editingClassId = null;
    this.showDialog();
  }

  openForEdit(activity: RegularClassActivity): void {
    this.newClass = {
      ...activity,
      schedule: { ...activity.schedule, weekdays: [...activity.schedule.weekdays] },
    };
    this.isEdit = true;
    this.editingClassId = activity.id;
    this.showDialog();
  }

  private showDialog(): void {
    const dialog = document.getElementById('class_dialog') as HTMLDialogElement | null;
    dialog?.showModal();
  }

  closeDialog(): void {
    const dialog = document.getElementById('class_dialog') as HTMLDialogElement | null;
    dialog?.close();
  }

  private createEmptyClass(): NewClassActivity {
    const today = new Date();
    const localStartDate = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
      .join('-');

    return {
      name: '',
      type: 'class',
      startDate: localStartDate,
      level: StudentLevel.A1,
      teacher: '',
      schedule: { weekdays: [], startTime: '18:00', endTime: '19:00' },
      room: '',
      capacity: 12,
      status: 'active',
      color: 'violet',
    };
  }
}
