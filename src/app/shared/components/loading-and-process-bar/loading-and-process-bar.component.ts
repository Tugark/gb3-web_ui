import {Component, Input} from '@angular/core';
import {LoadingState} from '../../types/loading-state.type';
import {ViewProcessState} from '../../types/view-process-state.type';

@Component({
  selector: 'loading-and-process-bar',
  templateUrl: './loading-and-process-bar.component.html',
  styleUrls: ['./loading-and-process-bar.component.scss'],
  standalone: false,
})
export class LoadingAndProcessBarComponent {
  @Input() public loadingState: LoadingState;
  @Input() public viewProcessState: ViewProcessState;
}
