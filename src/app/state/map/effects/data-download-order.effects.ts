import {Inject, Injectable} from '@angular/core';
import {Actions, concatLatestFrom, createEffect, ofType} from '@ngrx/effects';
import {map} from 'rxjs/operators';
import {DataDownloadOrderActions} from '../actions/data-download-order.actions';
import {MapUiActions} from '../actions/map-ui.actions';
import {MAP_SERVICE} from '../../../app.module';
import {MapService} from '../../../map/interfaces/map.service';
import {filter, tap} from 'rxjs';
import {MapDrawingService} from '../../../map/services/map-drawing.service';
import {ConfigService} from '../../../shared/services/config.service';
import {Store} from '@ngrx/store';
import {ToolActions} from '../actions/tool.actions';
import {selectActiveTool} from '../reducers/tool.reducer';

@Injectable()
export class DataDownloadOrderEffects {
  public openDataDownloadDrawerAfterCompletingSelection$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadOrderActions.setSelection),
      map(({selection}) => {
        this.mapService.zoomToExtent(
          selection.drawingRepresentation.geometry,
          this.configService.mapAnimationConfig.zoom.expandFactor,
          this.configService.mapAnimationConfig.zoom.duration,
        );
        return MapUiActions.showMapSideDrawerContent({mapSideDrawerContent: 'data-download'});
      }),
    );
  });

  public deactivateToolAfterClearingSelection$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadOrderActions.clearSelection),
      concatLatestFrom(() => this.store.select(selectActiveTool)),
      filter(([_, activeTool]) => activeTool !== undefined),
      map(() => {
        return ToolActions.deactivateTool();
      }),
    );
  });

  public clearSelectionAfterClosingDataDownloadDrawer$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MapUiActions.hideMapSideDrawerContent),
      map(() => DataDownloadOrderActions.clearSelection()),
    );
  });

  public clearGeometryFromMap$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DataDownloadOrderActions.clearSelection),
        tap(() => {
          this.mapDrawingService.clearDataDownloadSelection();
        }),
      );
    },
    {dispatch: false},
  );

  constructor(
    private readonly actions$: Actions,
    private readonly mapDrawingService: MapDrawingService,
    @Inject(MAP_SERVICE) private readonly mapService: MapService,
    private readonly configService: ConfigService,
    private readonly store: Store,
  ) {}
}