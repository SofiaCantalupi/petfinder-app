import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-password-requisito',
  standalone: true,
  imports: [NgClass],
  templateUrl: './password-requisito.html',
})
export class PasswordRequisito {
  cumplido = input<boolean>(false);
}
