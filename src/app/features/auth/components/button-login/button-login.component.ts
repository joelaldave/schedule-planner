import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button-login',
  imports: [],
  templateUrl: './button-login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonLoginComponent {

  title = input<string>();

  onClick = output();

 }
