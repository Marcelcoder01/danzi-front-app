import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-payment-checkbox',
  standalone: true,
  templateUrl: './payment-checkbox.component.html',
  styleUrl: './payment-checkbox.component.css',
})
export class PaymentCheckboxComponent {
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  onChange(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}
