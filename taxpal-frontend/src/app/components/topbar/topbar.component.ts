import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  @Input() userName?: string;
  @Output() menuClick = new EventEmitter<void>();

  onMenuClick(): void {
    this.menuClick.emit();
  }
}

