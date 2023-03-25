import {Component, Input} from '@angular/core';
import {HasLoadingState} from '../../../../shared/interfaces/has-loading-state.interface';
import {LoadingState} from '../../../../shared/types/loading-state';
import {Favourite} from '../../../../shared/interfaces/favourite.interface';
import {Store} from '@ngrx/store';
import {FavouriteListActions} from '../../../../state/map/actions/favourite-list.actions';
import {ActiveMapItemActions} from '../../../../state/map/actions/active-map-item.actions';
import {FavouritesService} from '../../../services/favourites.service';

const FAVOURITE_ERROR_TOOLTIP =
  'Der Favorit kann nicht angezeigt werden. Dies kann verschiedene Gründe haben - z.B. existiert eine (' +
  'oder mehrere) Karten innerhalb des Favorits nicht mehr.';

@Component({
  selector: 'favourite-selection',
  templateUrl: './favourite-selection.component.html',
  styleUrls: ['./favourite-selection.component.scss']
})
export class FavouriteSelectionComponent implements HasLoadingState {
  @Input() public loadingState: LoadingState = 'undefined';
  @Input() public filteredFavourites: Favourite[] = [];
  @Input() public isAuthenticated: boolean = false;
  @Input() public filterString: string = '';

  public readonly errorTooltip: string = FAVOURITE_ERROR_TOOLTIP;

  constructor(private readonly store: Store, private readonly favouritesService: FavouritesService) {}

  /**
   * Dispatches an action that adds a favourite to the map.
   * @param favouriteLayerConfigurations
   */
  public addFavouriteToMap({id, content}: Favourite) {
    try {
      const activeMapItemsForFavourite = this.favouritesService.getActiveMapItemsForFavourite(content);
      this.store.dispatch(ActiveMapItemActions.addFavourite({favourite: activeMapItemsForFavourite}));
    } catch (e) {
      this.store.dispatch(FavouriteListActions.setInvalid({id}));
    }
  }
}