import {provideMockActions} from '@ngrx/effects/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {EMPTY, Observable, of, throwError} from 'rxjs';
import {Action} from '@ngrx/store';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ElevationProfileEffects} from './elevation-profile.effects';
import {ToolActions} from '../actions/tool.actions';
import {MAP_SERVICE} from '../../../app.module';
import {MapServiceStub} from '../../../testing/map-testing/map.service.stub';
import {MapService} from '../../../map/interfaces/map.service';
import {ElevationProfileActions} from '../actions/elevation-profile.actions';
import {InternalDrawingLayer} from '../../../shared/enums/drawing-layer.enum';
import {MapUiActions} from '../actions/map-ui.actions';
import {SwisstopoApiService} from '../../../shared/services/apis/swisstopo/swisstopo-api.service';
import {ElevationProfileData} from '../../../shared/interfaces/elevation-profile.interface';
import {MinimalGeometriesUtils} from '../../../testing/map-testing/minimal-geometries.utils';
import {catchError} from 'rxjs/operators';
import {ElevationProfileCouldNotBeLoaded} from '../../../shared/errors/elevation-profile.errors';

describe('ElevationProfileEffects', () => {
  let actions$: Observable<Action>;
  let effects: ElevationProfileEffects;
  let mapService: MapService;
  let mapServiceSpy: jasmine.Spy;
  let swisstopoApiService: SwisstopoApiService;
  let swisstopoApiServiceSpy: jasmine.Spy;

  beforeEach(() => {
    actions$ = new Observable<Action>();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ElevationProfileEffects,
        SwisstopoApiService,
        provideMockActions(() => actions$),
        {provide: MAP_SERVICE, useClass: MapServiceStub},
      ],
    });
    effects = TestBed.inject(ElevationProfileEffects);
    mapService = TestBed.inject(MAP_SERVICE);
    swisstopoApiService = TestBed.inject(SwisstopoApiService);
  });

  describe('clearExistingElevationProfilesOnNew$', () => {
    it('does nothing for other tools', fakeAsync(async () => {
      mapServiceSpy = spyOn(mapService, 'clearInternalDrawingLayer');
      actions$ = of(ToolActions.activateTool({tool: 'measure-line'}));

      effects.clearExistingElevationProfilesOnNew$.subscribe();
      tick();

      expect(mapServiceSpy).not.toHaveBeenCalled();
      actions$.subscribe((action) => expect(action).toEqual(ToolActions.activateTool({tool: 'measure-line'})));
    }));

    it('clears internal layers and dispatches ElevationProfileActions.clearProfile', (done: DoneFn) => {
      mapServiceSpy = spyOn(mapService, 'clearInternalDrawingLayer');
      actions$ = of(ToolActions.activateTool({tool: 'measure-elevation-profile'}));

      effects.clearExistingElevationProfilesOnNew$.subscribe((action) => {
        expect(mapServiceSpy).toHaveBeenCalledOnceWith(InternalDrawingLayer.ElevationProfile);
        expect(action).toEqual(ElevationProfileActions.clearProfile());
        done();
      });
    });
  });

  describe('clearExistingElevationProfileOnClose$', () => {
    it('does nothing if elevation profile is being set to visible', fakeAsync(async () => {
      mapServiceSpy = spyOn(mapService, 'clearInternalDrawingLayer');
      actions$ = of(MapUiActions.setElevationProfileOverlayVisibility({isVisible: true}));

      effects.clearExistingElevationProfileOnClose$.subscribe();
      tick();

      expect(mapServiceSpy).not.toHaveBeenCalled();
      actions$.subscribe((action) => expect(action).toEqual(MapUiActions.setElevationProfileOverlayVisibility({isVisible: true})));
    }));

    it('clears internal layers and dispatches ElevationProfileActions.clearProfile if is set to invisible', (done: DoneFn) => {
      mapServiceSpy = spyOn(mapService, 'clearInternalDrawingLayer');
      actions$ = of(MapUiActions.setElevationProfileOverlayVisibility({isVisible: false}));

      effects.clearExistingElevationProfileOnClose$.subscribe((action) => {
        expect(mapServiceSpy).toHaveBeenCalledOnceWith(InternalDrawingLayer.ElevationProfile);
        expect(action).toEqual(ElevationProfileActions.clearProfile());
        done();
      });
    });
  });

  describe('requestElevationProfile$', () => {
    it('calls the swisstopo API and returns the data', (done: DoneFn) => {
      const mockData: ElevationProfileData = {
        dataPoints: [{altitude: 1, distance: 250}],
        statistics: {groundDistance: 666, linearDistance: 42, elevationDifference: 1337, lowestPoint: 9000, highestPoint: 9001},
      };
      const mockGeometry = MinimalGeometriesUtils.getMinimalLineString(2056);
      swisstopoApiServiceSpy = spyOn(swisstopoApiService, 'loadElevationProfile').and.returnValue(of(mockData));
      actions$ = of(ElevationProfileActions.loadProfile({geometry: mockGeometry}));

      effects.requestElevationProfile$.subscribe((action) => {
        expect(swisstopoApiServiceSpy).toHaveBeenCalledOnceWith(mockGeometry);
        expect(action).toEqual(ElevationProfileActions.updateContent({data: mockData}));
        done();
      });
    });

    it('dispatches ElevationProfileActions.setError on API error', (done: DoneFn) => {
      const mockGeometry = MinimalGeometriesUtils.getMinimalLineString(2056);
      const expectedError = new Error('oh no! butterfingers');
      swisstopoApiServiceSpy = spyOn(swisstopoApiService, 'loadElevationProfile').and.returnValue(throwError(() => expectedError));
      actions$ = of(ElevationProfileActions.loadProfile({geometry: mockGeometry}));

      effects.requestElevationProfile$.subscribe((action) => {
        expect(swisstopoApiServiceSpy).toHaveBeenCalledOnceWith(mockGeometry);
        expect(action).toEqual(ElevationProfileActions.setError({error: expectedError}));
        done();
      });
    });
  });

  describe('setElevationProfileError$', () => {
    it('throws a ElevationProfileCouldNotBeLoaded error', (done: DoneFn) => {
      const expectedOriginalError = new Error('oh no! butterfingers');

      actions$ = of(ElevationProfileActions.setError({error: expectedOriginalError}));
      effects.setElevationProfileError$
        .pipe(
          catchError((error) => {
            const expectedError = new ElevationProfileCouldNotBeLoaded(expectedOriginalError);
            expect(error).toEqual(expectedError);
            done();
            return EMPTY;
          }),
        )
        .subscribe();
    });
  });
});
