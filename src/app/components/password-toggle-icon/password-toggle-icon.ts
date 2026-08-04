import { Component, model } from '@angular/core';

@Component({
  selector: 'app-password-toggle-icon',
  standalone: true,
  imports: [],
  templateUrl: './password-toggle-icon.html',
})
export class PasswordToggleIcon {
  visible = model<boolean>(false);

  toggle(): void {
    this.visible.set(!this.visible());
  }
}
