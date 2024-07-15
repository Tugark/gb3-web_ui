import {TestBed} from '@angular/core/testing';
import {EsriToolService} from './esri-tool.service';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {selectDrawingLayers} from '../../../../state/map/selectors/drawing-layers.selector';
import {EsriMapMock} from '../../../../testing/map-testing/esri-map.mock';
import {EsriMapViewService} from '../esri-map-view.service';
import {EsriPointMeasurementStrategy} from './strategies/measurement/esri-point-measurement.strategy';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import {InternalDrawingLayer, UserDrawingLayer} from '../../../../shared/enums/drawing-layer.enum';
import {DrawingActiveMapItem} from '../../../models/implementations/drawing.model';
import {EsriLineMeasurementStrategy} from './strategies/measurement/esri-line-measurement.strategy';
import {EsriAreaMeasurementStrategy} from './strategies/measurement/esri-area-measurement.strategy';
import {take, tap} from 'rxjs';
import {ActiveMapItemActions} from '../../../../state/map/actions/active-map-item.actions';
import {ActiveMapItemFactory} from '../../../../shared/factories/active-map-item.factory';
import {MapConstants} from '../../../../shared/constants/map.constants';
import {MatDialogModule} from '@angular/material/dialog';
import {EsriPointDrawingStrategy} from './strategies/drawing/esri-point-drawing.strategy';
import {EsriLineDrawingStrategy} from './strategies/drawing/esri-line-drawing.strategy';
import {EsriPolygonDrawingStrategy} from './strategies/drawing/esri-polygon-drawing.strategy';
import {EsriTextDrawingStrategy} from './strategies/drawing/esri-text-drawing.strategy';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {EsriElevationProfileMeasurementStrategy} from './strategies/measurement/esri-elevation-profile-measurement.strategy';
import {EsriPolygonSelectionStrategy} from './strategies/selection/esri-polygon-selection.strategy';
import {EsriScreenExtentSelectionStrategy} from './strategies/selection/esri-screen-extent-selection.strategy';
import {EsriCantonSelectionStrategy} from './strategies/selection/esri-canton-selection.strategy';
import {EsriMunicipalitySelectionStrategy} from './strategies/selection/esri-municipality-selection.strategy';
import Graphic from '@arcgis/core/Graphic';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Color from '@arcgis/core/Color';
import {DrawingActions} from '../../../../state/map/actions/drawing.actions';
import {EsriGraphicToInternalDrawingRepresentationUtils} from '../utils/esri-graphic-to-internal-drawing-representation.utils';
import {DataDownloadSelection} from '../../../../shared/interfaces/data-download-selection.interface';
import {DataDownloadOrderActions} from '../../../../state/map/actions/data-download-order.actions';
import {ToolActions} from '../../../../state/map/actions/tool.actions';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

describe('EsriToolService', () => {
  let service: EsriToolService;
  let mapMock: EsriMapMock;
  let mapViewService: EsriMapViewService = new EsriMapViewService();
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        provideMockStore({selectors: [{selector: selectDrawingLayers, value: []}]}),
        {
          provide: EsriMapViewService,
          useValue: mapViewService,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EsriToolService);
    store = TestBed.inject(MockStore);

    TestBed.inject(EsriToolService);
    // mock the map view from Esri - otherwise any change to the layer list will create an error because the service call fails
    mapMock = new EsriMapMock([]);
    mapViewService = TestBed.inject(EsriMapViewService);
    mapViewService.mapView = {
      map: mapMock,
      addHandles<T>(handles: IHandle | IHandle[], groupKey?: GroupKey<T>) {},
      removeHandles<T>(groupKey?: GroupKey<T>) {},
      on(type: string | string[], listener: __esri.EventHandler): IHandle {
        return {} as IHandle;
      },
    } as __esri.MapView;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Visibility Handling', () => {
    let userDrawingLayerId: string;
    beforeEach(() => {
      userDrawingLayerId = MapConstants.USER_DRAWING_LAYER_PREFIX + UserDrawingLayer.Measurements;
    });

    it('forces visibility if layer is present by dispatching an action', () => {
      // add the graphic layer to the view to avoid the initialization
      mapViewService.mapView.map.layers.add(
        new GraphicsLayer({
          id: userDrawingLayerId,
        }),
      );
      store.overrideSelector(selectDrawingLayers, [{id: userDrawingLayerId} as DrawingActiveMapItem]);
      store.refreshState();

      service.initializeMeasurement('measure-point');

      store.scannedActions$
        .pipe(
          take(1),
          tap((lastAction) => {
            const expected = {
              activeMapItem: {id: userDrawingLayerId},
              type: ActiveMapItemActions.forceFullVisibility.type,
            };
            expect(lastAction).toEqual(expected);
          }),
        )
        .subscribe();
    });
    it('adds a new mapitem if the layer is not present', () => {
      service.initializeMeasurement('measure-point');

      store.scannedActions$
        .pipe(
          take(1),
          tap((lastAction) => {
            const expected = {
              activeMapItem: ActiveMapItemFactory.createDrawingMapItem(
                UserDrawingLayer.Measurements,
                MapConstants.USER_DRAWING_LAYER_PREFIX,
              ),
              position: 0,
              type: ActiveMapItemActions.addActiveMapItem.type,
            };
            expect(lastAction).toEqual(expected);
          }),
        )
        .subscribe();
    });
    it('adds Esri handles for this service group on drawing start for Escape-Key and Pointer-Move-Events', () => {
      // add the graphic layer to the view to avoid the initialization
      const spy = spyOn(mapViewService.mapView, 'addHandles');
      mapViewService.mapView.map.layers.add(
        new GraphicsLayer({
          id: userDrawingLayerId,
        }),
      );
      store.overrideSelector(selectDrawingLayers, [{id: userDrawingLayerId} as DrawingActiveMapItem]);
      store.refreshState();

      service.initializeMeasurement('measure-point');

      expect(spy).toHaveBeenCalledTimes(2);
      expect((spy.calls.first().args[0] as any).remove).toBeDefined(); // we know that it must be a WatchHandle
      expect(spy.calls.first().args[1]).toEqual('EsriToolService');
      expect(spy.calls.mostRecent().args[1]).toEqual('EsriToolService');
    });
  });

  describe('Strategy Initialization', () => {
    describe('Measurement', () => {
      beforeEach(() => {
        const userDrawingLayerId = MapConstants.USER_DRAWING_LAYER_PREFIX + UserDrawingLayer.Measurements;
        // add the graphic layer to the view to avoid the initialization
        mapViewService.mapView.map.layers.add(
          new GraphicsLayer({
            id: userDrawingLayerId,
          }),
        );
        store.overrideSelector(selectDrawingLayers, [{id: userDrawingLayerId} as DrawingActiveMapItem]);
        store.refreshState();
      });
      it(`sets the correct strategy for point measurement`, () => {
        const pointSpy = spyOn(EsriPointMeasurementStrategy.prototype, 'start');
        service.initializeMeasurement('measure-point');
        expect(pointSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for line measurement`, () => {
        const lineSpy = spyOn(EsriLineMeasurementStrategy.prototype, 'start');
        service.initializeMeasurement('measure-line');
        expect(lineSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for area measurement`, () => {
        const polygonSpy = spyOn(EsriAreaMeasurementStrategy.prototype, 'start');
        service.initializeMeasurement('measure-area');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for circle measurement`, () => {
        const polygonSpy = spyOn(EsriAreaMeasurementStrategy.prototype, 'start');
        service.initializeMeasurement('measure-circle');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it('cancels the previous tool when a new one is selected', () => {
        const polygonSpy = spyOn(EsriAreaMeasurementStrategy.prototype, 'start');
        const lineSpy = spyOn(EsriLineMeasurementStrategy.prototype, 'start');
        const cancelSpy = spyOn(service, 'cancelTool');
        service.initializeMeasurement('measure-area');
        service.initializeMeasurement('measure-line');
        expect(polygonSpy).toHaveBeenCalled();
        expect(lineSpy).toHaveBeenCalled();
        expect(cancelSpy).toHaveBeenCalled();
      });
    });

    describe('Drawing', () => {
      beforeEach(() => {
        const userDrawingLayerId = MapConstants.USER_DRAWING_LAYER_PREFIX + UserDrawingLayer.Drawings;
        // add the graphic layer to the view to avoid the initialization
        mapViewService.mapView.map.layers.add(
          new GraphicsLayer({
            id: userDrawingLayerId,
          }),
        );
        store.overrideSelector(selectDrawingLayers, [{id: userDrawingLayerId} as DrawingActiveMapItem]);
        store.refreshState();
      });
      it(`sets the correct strategy for point drawing`, () => {
        const pointSpy = spyOn(EsriPointDrawingStrategy.prototype, 'start');
        service.initializeDrawing('draw-point');
        expect(pointSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for line drawing`, () => {
        const lineSpy = spyOn(EsriLineDrawingStrategy.prototype, 'start');
        service.initializeDrawing('draw-line');
        expect(lineSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for polygon drawing`, () => {
        const polygonSpy = spyOn(EsriPolygonDrawingStrategy.prototype, 'start');
        service.initializeDrawing('draw-polygon');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for text drawing`, () => {
        const polygonSpy = spyOn(EsriTextDrawingStrategy.prototype, 'start');
        service.initializeDrawing('draw-text');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for rectangle drawing`, () => {
        const polygonSpy = spyOn(EsriPolygonDrawingStrategy.prototype, 'start');
        service.initializeDrawing('draw-rectangle');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for circle drawing`, () => {
        const polygonSpy = spyOn(EsriPolygonDrawingStrategy.prototype, 'start');
        service.initializeDrawing('draw-circle');
        expect(polygonSpy).toHaveBeenCalled();
      });
    });

    describe('DataDownloadSelection', () => {
      beforeEach(() => {
        const internalDrawingLayerId = MapConstants.INTERNAL_LAYER_PREFIX + InternalDrawingLayer.Selection;
        // add the graphic layer to the view to avoid the initialization
        mapViewService.mapView.map.layers.add(
          new GraphicsLayer({
            id: internalDrawingLayerId,
          }),
        );
        store.refreshState();
      });
      it(`sets the correct strategy for circle selection`, () => {
        const polygonSpy = spyOn(EsriPolygonSelectionStrategy.prototype, 'start');
        service.initializeDataDownloadSelection('select-circle');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for polygon selection`, () => {
        const polygonSpy = spyOn(EsriPolygonSelectionStrategy.prototype, 'start');
        service.initializeDataDownloadSelection('select-polygon');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for rectangle selection`, () => {
        const polygonSpy = spyOn(EsriPolygonSelectionStrategy.prototype, 'start');
        service.initializeDataDownloadSelection('select-rectangle');
        expect(polygonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for section selection`, () => {
        const screenExtentSpy = spyOn(EsriScreenExtentSelectionStrategy.prototype, 'start');
        service.initializeDataDownloadSelection('select-section');
        expect(screenExtentSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for canton selection`, () => {
        const cantonSpy = spyOn(EsriCantonSelectionStrategy.prototype, 'start');
        service.initializeDataDownloadSelection('select-canton');
        expect(cantonSpy).toHaveBeenCalled();
      });
      it(`sets the correct strategy for municipality selection`, () => {
        const municipalitySpy = spyOn(EsriMunicipalitySelectionStrategy.prototype, 'start');
        service.initializeDataDownloadSelection('select-municipality');
        expect(municipalitySpy).toHaveBeenCalled();
      });
    });

    describe('ElevationProfile', () => {
      beforeEach(() => {
        const elevationProfileLayerId = MapConstants.INTERNAL_LAYER_PREFIX + InternalDrawingLayer.ElevationProfile;
        // add the graphic layer to the view to avoid the initialization
        mapViewService.mapView.map.layers.add(
          new GraphicsLayer({
            id: elevationProfileLayerId,
          }),
        );
      });
      it(`sets the correct strategy for elevation profile measurement`, () => {
        const elevationSpy = spyOn(EsriElevationProfileMeasurementStrategy.prototype, 'start');
        service.initializeElevationProfileMeasurement();
        expect(elevationSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Strategy Completion', () => {
    const graphicMock = new Graphic({
      attributes: {
        [MapConstants.DRAWING_IDENTIFIER]: 'id',
      },
      geometry: new Polygon({
        spatialReference: {wkid: 2056},
        rings: [
          [
            [0, 0],
            [0, 69],
            [42, 0],
            [0, 0],
          ],
        ],
      }),
      symbol: new SimpleFillSymbol({
        color: new Color(Color.fromHex('#abcdef')),
        outline: {width: 42, color: new Color('#080085')},
      }),
    });

    it('completes drawings by dispatching DrawingActions.addDrawing and calling endDrawing', () => {
      const labelText = 'labelText';
      const storeSpy = spyOn(store, 'dispatch').and.callThrough();
      const endDrawingSpy = spyOn<any>(service, 'endDrawing').and.stub();
      const internalDrawingRepresentation = EsriGraphicToInternalDrawingRepresentationUtils.convert(
        graphicMock,
        labelText,
        2056,
        UserDrawingLayer.Drawings,
      );

      const expectedAction = DrawingActions.addDrawing({drawing: internalDrawingRepresentation});

      service.completeDrawing(graphicMock, labelText);

      expect(storeSpy).toHaveBeenCalledOnceWith(expectedAction);
      expect(endDrawingSpy).toHaveBeenCalledOnceWith();
    });

    it('completes measurements by dispatching DrawingActions.addDrawing and calling endDrawing', () => {
      const labelText = 'labelText';
      const labelPoint = new Graphic({
        attributes: {
          [MapConstants.DRAWING_IDENTIFIER]: 'idTwo',
          [MapConstants.DRAWING_LABEL_IDENTIFIER]: 'id',
        },
        geometry: new Polygon({
          spatialReference: {wkid: 4326},
          rings: [
            [
              [0, 0],
              [0, 69],
              [42, 0],
              [0, 0],
            ],
          ],
        }),
        symbol: new SimpleFillSymbol({
          color: new Color(Color.fromHex('#abcdef')),
          outline: {width: 42, color: new Color('#080085')},
        }),
      });
      const storeSpy = spyOn(store, 'dispatch').and.callThrough();
      const endDrawingSpy = spyOn<any>(service, 'endDrawing').and.stub();
      const internalDrawingRepresentation = EsriGraphicToInternalDrawingRepresentationUtils.convert(
        graphicMock,
        undefined,
        2056,
        UserDrawingLayer.Measurements,
      );
      const internalDrawingRepresentationLabel = EsriGraphicToInternalDrawingRepresentationUtils.convert(
        labelPoint,
        labelText,
        2056,
        UserDrawingLayer.Measurements,
      );

      const expectedAction = DrawingActions.addDrawings({drawings: [internalDrawingRepresentation, internalDrawingRepresentationLabel]});

      service.completeMeasurement(graphicMock, labelPoint, labelText);

      expect(storeSpy).toHaveBeenCalledOnceWith(expectedAction);
      expect(endDrawingSpy).toHaveBeenCalledOnceWith();
    });

    it('completes selections by dispatching DataDownloadOrderActions.setSelection if the selection is not `undefined`', () => {
      const internalDrawingRepresentation = EsriGraphicToInternalDrawingRepresentationUtils.convert(
        graphicMock,
        undefined,
        2056,
        InternalDrawingLayer.Selection,
      );
      const selection: DataDownloadSelection = {
        type: 'polygon',
        drawingRepresentation: internalDrawingRepresentation,
      };
      const storeSpy = spyOn(store, 'dispatch').and.callThrough();
      const removeHandlesSpy = spyOn(mapViewService.mapView, 'removeHandles').and.stub();

      const expectedAction = DataDownloadOrderActions.setSelection({selection});

      service.completeSelection(selection);

      expect(storeSpy).toHaveBeenCalledOnceWith(expectedAction);
      expect(removeHandlesSpy).toHaveBeenCalledOnceWith('EsriToolService');
    });

    it('completes selections by dispatching ToolActions.cancelTool if the selection is `undefined`', () => {
      const storeSpy = spyOn(store, 'dispatch').and.callThrough();
      const removeHandlesSpy = spyOn(mapViewService.mapView, 'removeHandles').and.stub();

      const expectedAction = ToolActions.cancelTool();

      service.completeSelection(undefined);

      expect(storeSpy).toHaveBeenCalledOnceWith(expectedAction);
      expect(removeHandlesSpy).toHaveBeenCalledOnceWith('EsriToolService');
    });
  });
});
