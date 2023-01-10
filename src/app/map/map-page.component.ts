import {Component, OnDestroy} from '@angular/core';
import {MapConfigurationUrlService} from './services/map-configuration-url.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription, tap} from 'rxjs';

@Component({
  selector: 'map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss'],
  providers: [MapConfigurationUrlService]
})
export class MapPageComponent implements OnDestroy {
  public printFeatureInfoActive: boolean = false;
  private readonly subscriptions$: Subscription = new Subscription();

  constructor(private readonly mapConfigurationUrlService: MapConfigurationUrlService, private route: ActivatedRoute) {
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }

  public showPrint() {
    this.mapConfigurationUrlService.acticatePrintMode();
  }

  private initSubscriptions() {
    this.subscriptions$.add(
      this.route.queryParamMap
        .pipe(
          tap((p) => {
            this.printFeatureInfoActive = p.get('print') === 'featureInfo';
          })
        )
        .subscribe()
    );
  }
}
