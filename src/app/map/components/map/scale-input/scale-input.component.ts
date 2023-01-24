import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, tap} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectScale} from '../../../../core/state/map/reducers/map-config.reducer';
import {MapConfigActions} from '../../../../core/state/map/actions/map-config.actions';
import {ConfigService} from '../../../../shared/services/config.service';

@Component({
  selector: 'scale-input',
  templateUrl: './scale-input.component.html',
  styleUrls: ['./scale-input.component.scss']
})
export class ScaleInputComponent implements OnInit, OnDestroy {
  public scale: number = 0;
  public readonly maxScale = this.configService.mapConfig.mapScaleConfig.maxScale;
  public readonly minScale = this.configService.mapConfig.mapScaleConfig.minScale;
  private readonly subscriptions: Subscription = new Subscription();
  private readonly scaleState$: Observable<number> = this.store.select(selectScale);

  constructor(private readonly store: Store, private readonly configService: ConfigService) {}

  public setScale(event: Event) {
    const newScale = (event.target as HTMLInputElement).valueAsNumber;
    this.store.dispatch(MapConfigActions.setScale({scale: newScale}));
  }

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initSubscriptions() {
    this.subscriptions.add(this.scaleState$.pipe(tap((value) => (this.scale = Math.round(value)))).subscribe());
  }
}
