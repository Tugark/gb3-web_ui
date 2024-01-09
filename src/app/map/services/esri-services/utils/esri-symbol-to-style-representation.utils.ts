import Symbol from '@arcgis/core/symbols/Symbol';
import {Gb3StyleRepresentation} from '../../../../shared/interfaces/internal-drawing-representation.interface';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {UnsupportedSymbolizationType} from '../errors/esri.errors';

export class EsriSymbolToStyleRepresentationUtils {
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static convert(symbol: Symbol): Gb3StyleRepresentation {
    switch (symbol.type) {
      case 'simple-marker':
        return {
          pointRadius: (symbol as SimpleMarkerSymbol).size,
          fillColor: symbol.color.toHex(),
          fillOpacity: symbol.color.a,
          strokeWidth: (symbol as SimpleMarkerSymbol).outline.width,
          strokeOpacity: (symbol as SimpleMarkerSymbol).outline.color.a,
          strokeColor: (symbol as SimpleMarkerSymbol).outline.color.toHex(),
          type: 'point',
        };
      case 'simple-line':
        return {
          strokeColor: symbol.color.toHex(),
          strokeOpacity: symbol.color.a,
          strokeWidth: (symbol as SimpleLineSymbol).width,
          type: 'line',
        };
      case 'simple-fill':
        return {
          fillColor: symbol.color.toHex(),
          fillOpacity: symbol.color.a,
          strokeWidth: (symbol as SimpleFillSymbol).outline.width,
          strokeOpacity: (symbol as SimpleFillSymbol).outline.color.a,
          strokeColor: (symbol as SimpleFillSymbol).outline.color.toHex(),
          type: 'polygon',
        };
      case 'text':
        return {
          haloColor: (symbol as TextSymbol).haloColor.toHex(),
          fontColor: symbol.color.toHex(),
          fontFamily: (symbol as TextSymbol).font.family,
          fontSize: (symbol as TextSymbol).font.size.toString(),
          haloRadius: (symbol as TextSymbol).haloSize.toString(),
          labelYOffset: (symbol as TextSymbol).yoffset.toString(), // todo GB3-826: actual offset is rather x2.1
          labelAlign: 'ct', // todo GB3-826: move this to a constant?
          label: '[text]', // todo GB3-826: move this to a constant? note: it should also match the property in the interface
          type: 'text',
        };
      default:
        throw new UnsupportedSymbolizationType(symbol.type);
    }
  }
}
