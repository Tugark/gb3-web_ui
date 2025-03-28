import {Component} from '@angular/core';
import {SupportPage} from '../../../shared/enums/support-page.enum';

@Component({
  selector: 'support-page-navigation',
  templateUrl: './support-page-navigation.component.html',
  styleUrls: ['./support-page-navigation.component.scss'],
  standalone: false,
})
export class SupportPageNavigationComponent {
  protected readonly supportPageEnum = SupportPage;
}
