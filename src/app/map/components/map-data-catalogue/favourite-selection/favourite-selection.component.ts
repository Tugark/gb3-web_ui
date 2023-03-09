import {Component, OnDestroy, OnInit} from '@angular/core';
import {HasLoadingState} from '../../../../shared/interfaces/has-loading-state.interface';
import {LoadingState} from '../../../../shared/types/loading-state';
import {distinctUntilChanged, Subscription, tap} from 'rxjs';
import {Favourite, FavouriteLayerConfiguration} from '../../../../shared/interfaces/favourite.interface';
import {Store} from '@ngrx/store';
import {FavouriteListActions} from '../../../../state/map/actions/favourite-list.actions';
import {selectFavourites, selectLoadingState} from '../../../../state/map/reducers/favourite-list.reducer';
import {selectIsAuthenticated} from '../../../../state/auth/reducers/auth-status.reducer';
import {ActiveMapItemActions} from '../../../../state/map/actions/active-map-item.actions';
import {ActiveMapItem} from '../../../models/active-map-item.model';
import {Map, MapLayer} from '../../../../shared/interfaces/topic.interface';
import {selectAvailableMaps} from '../../../../state/map/selectors/available-maps.selector';

const FAVOURITE_ERROR_TOOLTIP =
  'Der Favorit kann nicht angezeigt werden. Dies kann verschiedene Gründe haben - z.B. existiert eine (' +
  'oder mehrere) Karten innerhalb des Favorits nicht mehr.';

@Component({
  selector: 'favourite-selection',
  templateUrl: './favourite-selection.component.html',
  styleUrls: ['./favourite-selection.component.scss']
})
export class FavouriteSelectionComponent implements HasLoadingState, OnInit, OnDestroy {
  public favourites: Favourite[] = [];
  public loadingState: LoadingState = 'undefined';
  public isAuthenticated: boolean = false;
  public readonly errorTooltip: string = FAVOURITE_ERROR_TOOLTIP;
  private readonly subscriptions: Subscription = new Subscription();
  private readonly loadingState$ = this.store.select(selectLoadingState);
  private readonly favourites$ = this.store.select(selectFavourites);
  private readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  private readonly availableMaps$ = this.store.select(selectAvailableMaps);
  private availableMaps: Map[] = [];

  constructor(private readonly store: Store) {}

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public ngOnInit(): void {
    this.subscriptions.add(this.availableMaps$.pipe(tap((value) => (this.availableMaps = value))).subscribe());
    this.subscriptions.add(this.loadingState$.pipe(tap((value) => (this.loadingState = value))).subscribe());
    this.subscriptions.add(this.favourites$.pipe(tap((favourites) => (this.favourites = favourites))).subscribe());
    this.subscriptions.add(
      this.isAuthenticated$
        .pipe(
          distinctUntilChanged(),
          tap((isAuthenticated) => {
            this.isAuthenticated = isAuthenticated;

            // This check is currently needed, because isAuthenticated might not be initialized yet
            if (this.isAuthenticated) {
              this.store.dispatch(FavouriteListActions.loadFavourites());
            }
          })
        )
        .subscribe()
    );
  }

  /**
   * Dispatches an action that adds a favourite to the map.
   * @param favouriteLayerConfigurations
   */
  public addFavouriteToMap({id, content}: Favourite) {
    try {
      const activeMapItemsForFavourite = this.getActiveMapItemsForFavourite(content);
      this.store.dispatch(ActiveMapItemActions.addFavourite({favourite: activeMapItemsForFavourite}));
    } catch (e) {
      this.store.dispatch(FavouriteListActions.setInvalid({id}));
    }
  }

  /**
   * Gets the active map items configured as per a saved favourite combination.
   *
   * Might throw in the following cases:
   * * A configuration declares a singleLayer, but its specified subLayer does not exist
   * * A configuration declares a map that does not exist
   *
   * Throws at the first occurrence of an error - this is to ensure that a favourite is somewhat stable, instead of showing only those parts
   * of the favourite that exist.
   * @param favouriteLayerConfigurations
   * @private
   */
  private getActiveMapItemsForFavourite(favouriteLayerConfigurations: FavouriteLayerConfiguration[]): ActiveMapItem[] {
    const activeMapItems: ActiveMapItem[] = [];

    favouriteLayerConfigurations.forEach((configuration) => {
      const map = structuredClone(this.availableMaps.find((availableMap) => availableMap.id === configuration.mapId));

      if (map) {
        let subLayer: MapLayer | undefined = undefined;
        if (configuration.isSingleLayer) {
          subLayer = map.layers.find((layer) => layer.id === configuration.layers[0].id);

          if (!subLayer) {
            throw new Error('Sublayer does not exist.');
          }
        } else {
          map.layers.forEach((layer) => {
            const sublayerConfiguration = configuration.layers.find((favLayer) => favLayer.id === layer.id);

            if (!sublayerConfiguration) {
              throw new Error('Sublayer does not exist.');
            }

            layer.visible = sublayerConfiguration.visible;
          });
          // ensure consistent sorting order with saved configuration in favourite
          const sortIds = configuration.layers.map((layer) => layer.id);
          map.layers.sort((a, b) => sortIds.indexOf(a.id) - sortIds.indexOf(b.id));
        }

        activeMapItems.push(new ActiveMapItem(map, subLayer, configuration.visible, configuration.opacity));
      } else {
        throw new Error('Map does not exist');
      }
    });

    return activeMapItems;
  }
}
