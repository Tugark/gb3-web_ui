import {TestBed} from '@angular/core/testing';

import {CoordinateParserService} from './coordinate-parser.service';
import {PointWithSrs} from '../../shared/interfaces/geojson-types-with-srs.interface';

describe('CoordinateParserService', () => {
  let service: CoordinateParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinateParserService);
  });

  describe('separators', () => {
    [' ', '          ', ',', ';', '/', '   / '].forEach((separator) => {
      it(`returns coordinates with "${separator}" as separator`, () => {
        const testString = `123${separator}456`;

        const result = service.parse(testString);

        const expected: PointWithSrs = {type: 'Point', coordinates: [123, 456], srs: 2056};
        expect(result).toEqual(expected);
      });
    });

    ['//', '.', '_', ':', '\\'].forEach((separator) => {
      it(`returns undefined with "${separator}" as separator`, () => {
        const testString = `123${separator}456`;

        const result = service.parse(testString);

        expect(result).toEqual(undefined);
      });
    });
  });

  describe('whitespace handling', () => {
    it('removes all whitespaces and returns coordinates if more than one whitespace separation exists', () => {
      const testString = ' 1 2 3 , 4 5 6 ';

      const result = service.parse(testString);

      const expected: PointWithSrs = {type: 'Point', coordinates: [123, 456], srs: 2056};
      expect(result).toEqual(expected);
    });

    it('returns undefined if whitespaces and separator and one number exists', () => {
      const testString = '123    /';

      const result = service.parse(testString);

      expect(result).toEqual(undefined);
    });
  });

  describe('input sanitization', () => {
    it('removes inverted commas (and lookalikes) from input values', () => {
      const testString = "1'2`3’4´56 / 12´345`6";

      const result = service.parse(testString);

      const expected: PointWithSrs = {type: 'Point', coordinates: [123456, 123456], srs: 2056};
      expect(result).toEqual(expected);
    });

    it('returns undefined if only one number is present', () => {
      const testString = '456,';

      const result = service.parse(testString);

      expect(result).toEqual(undefined);
    });
  });

  describe('non-numeric inputs', () => {
    it('returns undefined if no digits are present', () => {
      const testString = 'notReally,coordinates';

      const result = service.parse(testString);

      expect(result).toEqual(undefined);
    });

    it('returns undefined if one input is alphanumeric', () => {
      const testString = '123,45b';

      const result = service.parse(testString);

      expect(result).toEqual(undefined);
    });
  });
});
