import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {catchError, map} from 'rxjs/operators';
import {filter, of, switchMap, tap} from 'rxjs';
import {Store} from '@ngrx/store';
import {DataDownloadRegionActions} from '../actions/data-download-region.actions';
import {selectCanton, selectMunicipalities} from '../reducers/data-download-region.reducer';
import {Gb3GeoshopCantonService} from '../../../shared/services/apis/gb3/gb3-geoshop-canton.service';
import {Gb3GeoshopMunicipalitiesService} from '../../../shared/services/apis/gb3/gb3-geoshop-municipalities.service';
import {CantonCouldNotBeLoaded, MunicipalitiesCouldNotBeLoaded} from '../../../shared/errors/data-download.errors';

@Injectable()
export class DataDownloadRegionEffects {
  public loadCanton$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadRegionActions.loadCanton),
      concatLatestFrom(() => [this.store.select(selectCanton)]),
      filter(([_, canton]) => canton === undefined),
      switchMap(() =>
        this.geoshopCantonService.loadCanton().pipe(
          map((canton) => {
            return DataDownloadRegionActions.setCanton({canton});
          }),
          catchError((error: unknown) => of(DataDownloadRegionActions.setCantonError({error}))),
        ),
      ),
    );
  });

  public throwCantonError$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DataDownloadRegionActions.setCantonError),
        tap(({error}) => {
          throw new CantonCouldNotBeLoaded(error);
        }),
      );
    },
    {dispatch: false},
  );

  public loadMunicipalities$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadRegionActions.loadMunicipalities),
      concatLatestFrom(() => [this.store.select(selectMunicipalities)]),
      filter(([_, municipalities]) => municipalities.length === 0),
      switchMap(() =>
        this.geoshopMunicipalitiesService.loadMunicipalities().pipe(
          map((municipalities) => {
            return DataDownloadRegionActions.setMunicipalities({municipalities});
          }),
          catchError((error: unknown) => of(DataDownloadRegionActions.setMunicipalitiesError({error}))),
        ),
      ),
    );
  });

  public throwMunicipalitiesError$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DataDownloadRegionActions.setMunicipalitiesError),
        tap(({error}) => {
          throw new MunicipalitiesCouldNotBeLoaded(error);
        }),
      );
    },
    {dispatch: false},
  );

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly geoshopMunicipalitiesService: Gb3GeoshopMunicipalitiesService,
    private readonly geoshopCantonService: Gb3GeoshopCantonService,
  ) {}
}
