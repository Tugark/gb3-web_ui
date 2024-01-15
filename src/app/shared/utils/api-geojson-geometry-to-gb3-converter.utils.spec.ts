import {Geometry} from '../models/gb3-api-generated.interfaces';
import {LineString, MultiPoint, MultiPolygon, Point, Polygon} from 'geojson';
import {ApiGeojsonGeometryToGb3ConverterUtils} from './api-geojson-geometry-to-gb3-converter.utils';

describe('ApiGeojsonGeometryToGb3ConverterUtils', () => {
  it('converts an API polygon geometry to the internal SupportedGeometry type', () => {
    const geometry: Geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [100.0, 0.0],
          [101.0, 0.0],
          [101.0, 1.0],
          [100.0, 1.0],
          [100.0, 0.0],
        ],
        [
          [100.8, 0.8],
          [100.8, 0.2],
          [100.2, 0.2],
          [100.2, 0.8],
          [100.8, 0.8],
        ],
      ],
      crs: {type: 'name', properties: {name: 'EPSG:2056'}},
    };

    const actual = ApiGeojsonGeometryToGb3ConverterUtils.convert(geometry);
    const expected: Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [100.0, 0.0],
          [101.0, 0.0],
          [101.0, 1.0],
          [100.0, 1.0],
          [100.0, 0.0],
        ],
        [
          [100.8, 0.8],
          [100.8, 0.2],
          [100.2, 0.2],
          [100.2, 0.8],
          [100.8, 0.8],
        ],
      ],
    };

    expect(actual).toEqual(expected);
  });

  it('converts an API point geometry to the internal SupportedGeometry type', () => {
    const geometry: Geometry = {
      type: 'Point',
      coordinates: [123, 456],
      crs: {type: 'name', properties: {name: 'EPSG:2056'}},
    };

    const actual = ApiGeojsonGeometryToGb3ConverterUtils.convert(geometry);
    const expected: Point = {
      type: 'Point',
      coordinates: [123, 456],
    };

    expect(actual).toEqual(expected);
  });

  it('converts an API line string geometry to the internal SupportedGeometry type', () => {
    const geometry: Geometry = {
      type: 'LineString',
      coordinates: [
        [100.0, 0.0],
        [101.0, 1.0],
        [102.0, 2.0],
        [103.0, 3.0],
      ],
      crs: {type: 'name', properties: {name: 'EPSG:2056'}},
    };

    const actual = ApiGeojsonGeometryToGb3ConverterUtils.convert(geometry);
    const expected: LineString = {
      type: 'LineString',
      coordinates: [
        [100.0, 0.0],
        [101.0, 1.0],
        [102.0, 2.0],
        [103.0, 3.0],
      ],
    };

    expect(actual).toEqual(expected);
  });

  it('converts an API multi point geometry to the internal SupportedGeometry type', () => {
    const geometry: Geometry = {
      type: 'MultiPoint',
      coordinates: [
        [48.0, 8.0],
        [49.0, 9.0],
      ],
      crs: {type: 'name', properties: {name: 'EPSG:2056'}},
    };

    const actual = ApiGeojsonGeometryToGb3ConverterUtils.convert(geometry);
    const expected: MultiPoint = {
      type: 'MultiPoint',
      coordinates: [
        [48.0, 8.0],
        [49.0, 9.0],
      ],
    };

    expect(actual).toEqual(expected);
  });

  it('converts an API multi polygon geometry to the internal SupportedGeometry type', () => {
    const geometry: Geometry = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [102.0, 2.0],
            [103.0, 2.0],
            [103.0, 3.0],
            [102.0, 3.0],
            [102.0, 2.0],
          ],
        ],
        [
          [
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
          ],
          [
            [100.2, 0.2],
            [100.2, 0.8],
            [100.8, 0.8],
            [100.8, 0.2],
            [100.2, 0.2],
          ],
        ],
      ],
      crs: {type: 'name', properties: {name: 'EPSG:2056'}},
    };

    const actual = ApiGeojsonGeometryToGb3ConverterUtils.convert(geometry);
    const expected: MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [102.0, 2.0],
            [103.0, 2.0],
            [103.0, 3.0],
            [102.0, 3.0],
            [102.0, 2.0],
          ],
        ],
        [
          [
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
          ],
          [
            [100.2, 0.2],
            [100.2, 0.8],
            [100.8, 0.8],
            [100.8, 0.2],
            [100.2, 0.2],
          ],
        ],
      ],
    };

    expect(actual).toEqual(expected);
  });
});