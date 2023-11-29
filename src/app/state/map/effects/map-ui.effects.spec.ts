import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MapUiEffects} from './map-ui.effects';
import {provideMockActions} from '@ngrx/effects/testing';
import {MatDialog} from '@angular/material/dialog';
import {Observable, of} from 'rxjs';
import {Action} from '@ngrx/store';
import {MapUiActions} from '../actions/map-ui.actions';
import {ShareLinkDialogComponent} from '../../../map/components/share-link-dialog/share-link-dialog.component';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {ShareLinkActions} from '../actions/share-link.actions';
import {selectCurrentShareLinkItem} from '../selectors/current-share-link-item.selector';
import {ShareLinkItem} from '../../../shared/interfaces/share-link.interface';
import {SymbolizationToGb3ConverterUtils} from '../../../shared/utils/symbolization-to-gb3-converter.utils';

describe('MapUiEffects', () => {
  let actions$: Observable<Action>;
  let effects: MapUiEffects;
  let dialogService: jasmine.SpyObj<MatDialog>;
  let store: MockStore;
  const shareLinkItem: ShareLinkItem = {
    center: {x: 1, y: 1},
    scale: 101,
    basemapId: 'basemap',
    content: [],
    drawings: SymbolizationToGb3ConverterUtils.convertInternalToExternalRepresentation([]),
    measurements: SymbolizationToGb3ConverterUtils.convertInternalToExternalRepresentation([]),
  };

  beforeEach(() => {
    actions$ = new Observable<Action>();
    const spyDialogService = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [MapUiEffects, provideMockActions(() => actions$), provideMockStore(), {provide: MatDialog, useValue: spyDialogService}],
    });

    effects = TestBed.inject(MapUiEffects);
    store = TestBed.inject(MockStore);
    dialogService = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  afterEach(() => {
    store.resetSelectors();
  });

  describe('openShareLinkDialog$', () => {
    it('opens the ShareLinkDialog, no further action dispatch', () => {
      actions$ = of(MapUiActions.showShareLinkDialog());

      effects.openShareLinkDialog$.subscribe(() => {
        expect(dialogService.open).toHaveBeenCalledWith(ShareLinkDialogComponent, {
          panelClass: 'api-wrapper-dialog',
          restoreFocus: false,
        });
      });
    });
  });

  describe('createShareLink$', () => {
    it('dispatches ShareLinkActions.createItem() if the action was of type [MapUi] Show Share Link Dialog', (done: DoneFn) => {
      store.overrideSelector(selectCurrentShareLinkItem, shareLinkItem);

      const expectedAction = ShareLinkActions.createItem({item: shareLinkItem});
      actions$ = of(MapUiActions.showShareLinkDialog());

      effects.createShareLink$.subscribe((action) => {
        expect(action).toEqual(expectedAction);
        done();
      });
    });

    it('dispatches ShareLinkActions.createItem() if the action was of type [MapUi] Show Bottom Sheet and the bottomSheetContent is share-link', (done: DoneFn) => {
      store.overrideSelector(selectCurrentShareLinkItem, shareLinkItem);

      const expectedAction = ShareLinkActions.createItem({item: shareLinkItem});
      actions$ = of(MapUiActions.showBottomSheet({bottomSheetContent: 'share-link'}));
      effects.createShareLink$.subscribe((action) => {
        expect(action).toEqual(expectedAction);
        done();
      });
    });

    it('does not dispatch ShareLinkActions.createItem() if the action was of type [MapUi] Show Bottom Sheet but the bottomSheetContent is not share-link', fakeAsync(() => {
      store.overrideSelector(selectCurrentShareLinkItem, shareLinkItem);
      let actualAction;
      actions$ = of(MapUiActions.showBottomSheet({bottomSheetContent: 'basemap'}));
      effects.createShareLink$.subscribe((action) => (actualAction = action));
      tick();

      expect(actualAction).toBeUndefined();
    }));
  });
});
