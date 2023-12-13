import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {LoadingState} from '../../../shared/types/loading-state.type';
import {selectIsElevationProfileOverlayVisible} from '../../../state/map/reducers/map-ui.reducer';
import {Subscription, tap} from 'rxjs';
import {Store} from '@ngrx/store';
import {MapUiActions} from '../../../state/map/actions/map-ui.actions';
import {selectData, selectDownloadLink, selectLoadingState} from '../../../state/map/reducers/elevation-profile.reducer';
import {ElevationProfileData} from '../../../shared/interfaces/elevation-profile.interface';
import {SwisstopoApiService} from '../../../shared/services/apis/swisstopo/swisstopo-api.service';

@Component({
  selector: 'elevation-profile-overlay',
  templateUrl: './elevation-profile-overlay.component.html',
  styleUrls: ['./elevation-profile-overlay.component.scss'],
})
export class ElevationProfileOverlayComponent implements OnInit, OnDestroy, AfterViewInit {
  public isVisible: boolean = false;
  public elevationProfileData?: ElevationProfileData;
  public loadingState: LoadingState;
  public downloadCsvUrl?: string;
  public downloadPngUrl: string = '';

  private readonly isElevationProfileOverlayVisible$ = this.store.select(selectIsElevationProfileOverlayVisible);
  private readonly loadingState$ = this.store.select(selectLoadingState);
  private readonly elevationProfileData$ = this.store.select(selectData);
  private readonly downloadPngUrl$ = this.store.select(selectDownloadLink);
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly store: Store,
    private readonly swisstopoApiService: SwisstopoApiService,
  ) {}

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngAfterViewInit() {
    this.subscriptions.add(this.downloadPngUrl$.pipe(tap((url) => setTimeout(() => (this.downloadPngUrl = url ?? '')))).subscribe());
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public close() {
    this.store.dispatch(MapUiActions.setElevationProfileOverlayVisibility({isVisible: false}));
  }

  private createDownLoadLink(elevationProfileData: ElevationProfileData | undefined) {
    this.downloadCsvUrl = this.swisstopoApiService.createDownloadLinkUrl(elevationProfileData);
  }

  public downloadPng() {
    const downloadLinkAnchor: HTMLAnchorElement = document.createElement('a');
    downloadLinkAnchor.href = this.downloadPngUrl;
    downloadLinkAnchor.download = 'elevation.png';
    document.body.appendChild(downloadLinkAnchor);
    downloadLinkAnchor.click();
    document.body.removeChild(downloadLinkAnchor);
  }

  private initSubscriptions() {
    this.subscriptions.add(this.loadingState$.pipe(tap((value) => (this.loadingState = value))).subscribe());
    this.subscriptions.add(
      this.elevationProfileData$
        .pipe(
          tap((value) => {
            this.elevationProfileData = value;
            this.createDownLoadLink(value);
          }),
        )
        .subscribe(),
    );
    this.subscriptions.add(this.isElevationProfileOverlayVisible$.pipe(tap((isVisible) => (this.isVisible = isVisible))).subscribe());
  }
}
