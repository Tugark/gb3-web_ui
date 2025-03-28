import {DataDownloadSelectMunicipalityDialogComponent} from '../../../../../components/map-tools/data-download-select-municipality-dialog/data-download-select-municipality-dialog.component';
import {PanelClass} from '../../../../../../shared/enums/panel-class.enum';
import {MatDialog} from '@angular/material/dialog';
import {Observable, of, switchMap} from 'rxjs';
import {DataDownloadSelection} from '../../../../../../shared/interfaces/data-download-selection.interface';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import {AbstractEsriSelectionStrategy} from '../abstract-esri-selection.strategy';
import {UnstyledInternalDrawingRepresentation} from '../../../../../../shared/interfaces/internal-drawing-representation.interface';
import {InternalDrawingLayer} from '../../../../../../shared/enums/drawing-layer.enum';
import {Municipality, MunicipalityWithGeometry} from '../../../../../../shared/interfaces/gb3-geoshop-product.interface';
import {Gb3GeoshopMunicipalitiesService} from '../../../../../../shared/services/apis/gb3/gb3-geoshop-municipalities.service';
import {map} from 'rxjs';
import {ConfigService} from '../../../../../../shared/services/config.service';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';

export class EsriMunicipalitySelectionStrategy extends AbstractEsriSelectionStrategy<DrawingCallbackHandler['completeSelection']> {
  constructor(
    layer: GraphicsLayer,
    polygonSymbol: SimpleFillSymbol,
    completeCallbackHandler: DrawingCallbackHandler['completeSelection'],
    private readonly dialogService: MatDialog,
    private readonly configService: ConfigService,
    private readonly geoshopMunicipalitiesService: Gb3GeoshopMunicipalitiesService,
  ) {
    super(layer, polygonSymbol, completeCallbackHandler);
  }

  protected createSelection(): Observable<DataDownloadSelection | undefined> {
    const dialog = this.dialogService.open<DataDownloadSelectMunicipalityDialogComponent, void, Municipality | undefined>(
      DataDownloadSelectMunicipalityDialogComponent,
      {
        panelClass: PanelClass.ApiWrapperDialog,
        restoreFocus: false,
        autoFocus: false,
      },
    );
    return dialog.afterClosed().pipe(
      switchMap((municipality) => {
        if (municipality) {
          return this.geoshopMunicipalitiesService.loadMunicipalityWithGeometry(municipality.bfsNo).pipe(
            map((municipalityWithGeometry) => {
              const drawingRepresentation = this.createDrawingRepresentation(municipalityWithGeometry);
              const dataDownloadSelection: DataDownloadSelection = {
                type: 'municipality',
                drawingRepresentation: drawingRepresentation,
                municipality: municipality,
              };
              return dataDownloadSelection;
            }),
          );
        } else {
          return of(undefined);
        }
      }),
    );
  }

  private createDrawingRepresentation(municipalityWithGeometry: MunicipalityWithGeometry): UnstyledInternalDrawingRepresentation {
    return {
      type: 'Feature',
      properties: {},
      source: InternalDrawingLayer.Selection,
      geometry: {...municipalityWithGeometry.boundingBox, srs: this.configService.mapConfig.defaultMapConfig.srsId},
    };
  }
}
