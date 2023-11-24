import {ErrorHandler, Injectable} from '@angular/core';
import {Actions, concatLatestFrom, createEffect, ofType} from '@ngrx/effects';
import {catchError, map} from 'rxjs/operators';
import {filter, of, switchMap, tap} from 'rxjs';
import {Store} from '@ngrx/store';
import {ProductsCouldNotBeLoaded, RelevantProductsCouldNotBeLoaded} from '../../../shared/errors/data-download.errors';
import {DataDownloadProductActions} from '../actions/data-download-product.actions';
import {Gb3GeoshopProductsService} from '../../../shared/services/apis/gb3/gb3-geoshop-products.service';
import {selectItems} from '../reducers/active-map-item.reducer';
import {isActiveMapItemOfType} from '../../../shared/type-guards/active-map-item-type.type-guard';
import {Gb2WmsActiveMapItem} from '../../../map/models/implementations/gb2-wms.model';
import {selectProducts} from '../reducers/data-download-product.reducer';
import {MapUiActions} from '../actions/map-ui.actions';

@Injectable()
export class DataDownloadProductEffects {
  public loadAllProducts$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadProductActions.loadProductsAndRelevantProducts),
      map(() => DataDownloadProductActions.loadProducts()),
    );
  });

  public loadAllRelevantProducts$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadProductActions.loadProductsAndRelevantProducts),
      map(() => DataDownloadProductActions.loadRelevantProductIds()),
    );
  });

  public loadProducts$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadProductActions.loadProducts),
      concatLatestFrom(() => [this.store.select(selectProducts)]),
      filter(([_, products]) => products.length === 0),
      switchMap(() =>
        this.geoshopProductsService.loadProductList().pipe(
          map((productsList) => {
            return DataDownloadProductActions.setProducts({products: productsList.products});
          }),
          catchError((error: unknown) => of(DataDownloadProductActions.setProductsError({error}))),
        ),
      ),
    );
  });

  public handleProductsError$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DataDownloadProductActions.setProductsError),
        tap(({error}) => {
          this.errorHandler.handleError(new ProductsCouldNotBeLoaded(error));
        }),
      );
    },
    {dispatch: false},
  );

  public loadRelevantProductIds$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadProductActions.loadRelevantProductIds),
      concatLatestFrom(() => this.store.select(selectItems)),
      map(
        ([_, activeMapItems]) =>
          activeMapItems
            .filter(isActiveMapItemOfType(Gb2WmsActiveMapItem))
            .map((activeMapItem) => activeMapItem.geometadataUuid)
            .filter((guid) => guid !== null) as string[],
      ),
      switchMap((guids) =>
        this.geoshopProductsService.loadRelevanteProducts(guids).pipe(
          map((productIds) => {
            return DataDownloadProductActions.setRelevantProductIds({relevantProductIds: productIds});
          }),
          catchError((error: unknown) => of(DataDownloadProductActions.setRelevantProductIdsError({error}))),
        ),
      ),
    );
  });

  public handleRelevantProductIdsError$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DataDownloadProductActions.setRelevantProductIdsError),
        tap(({error}) => {
          this.errorHandler.handleError(new RelevantProductsCouldNotBeLoaded(error));
        }),
      );
    },
    {dispatch: false},
  );

  public initializeDataDownloadFilters$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DataDownloadProductActions.setProducts),
      map(({products}) => {
        const dataDownloadFilters = this.geoshopProductsService.extractProductFilterValues(products);
        return DataDownloadProductActions.setFilters({filters: dataDownloadFilters});
      }),
    );
  });

  public resetFiltersAndTermAfterClosingSideDrawer$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MapUiActions.hideMapSideDrawerContent),
      map(() => {
        return DataDownloadProductActions.resetFiltersAndTerm();
      }),
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly geoshopProductsService: Gb3GeoshopProductsService,
    private readonly errorHandler: ErrorHandler,
  ) {}
}
