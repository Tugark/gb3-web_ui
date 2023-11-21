import {SupportedEsriTool} from '../abstract-esri-drawable-tool.strategy';
import {AbstractEsriDrawingStrategy} from './abstract-esri-drawing.strategy';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {MatDialog} from '@angular/material/dialog';
import {PanelClass} from '../../../../../../shared/enums/panel-class.enum';
import {tap} from 'rxjs';
import {TextDrawingToolInputComponent} from '../../../../../components/text-drawing-tool-input/text-drawing-tool-input.component';

export class EsriTextDrawingStrategy extends AbstractEsriDrawingStrategy {
  protected readonly tool: SupportedEsriTool = 'point';
  private readonly dialogService: MatDialog;

  constructor(
    layer: __esri.GraphicsLayer,
    mapView: __esri.MapView,
    textSymbol: __esri.TextSymbol,
    completeDrawingCallbackHandler: DrawingCallbackHandler['complete'],
    dialogService: MatDialog,
  ) {
    super(layer, mapView, completeDrawingCallbackHandler);

    this.sketchViewModel.pointSymbol = textSymbol;
    this.dialogService = dialogService;
  }

  protected override handleComplete(graphic: __esri.Graphic) {
    const dialog = this.dialogService.open<TextDrawingToolInputComponent, void, string>(TextDrawingToolInputComponent, {
      panelClass: PanelClass.ApiWrapperDialog,
      restoreFocus: false,
      disableClose: true,
    });
    return dialog
      .afterClosed()
      .pipe(
        tap((text = '') => {
          (graphic.symbol as TextSymbol).text = text;
          super.handleComplete(graphic, text);
        }),
      )
      .subscribe();
  }
}