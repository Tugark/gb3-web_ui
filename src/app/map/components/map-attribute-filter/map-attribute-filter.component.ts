import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActiveMapItem, Gb2WmsMapItemConfiguration} from '../../models/active-map-item.model';
import {ActiveMapItemActions} from '../../../state/map/actions/active-map-item.actions';
import {Store} from '@ngrx/store';
import {Subscription, tap} from 'rxjs';
import {MapAttributeFiltersItemActions} from '../../../state/map/actions/map-attribute-filters-item.actions';
import {concatLatestFrom} from '@ngrx/effects';
import {selectActiveMapItems} from '../../../state/map/reducers/active-map-item.reducer';
import {selectMapAttributeFiltersItemId} from '../../../state/map/reducers/map-attribute-filters-item.reducer';
import {isActiveMapItemOfType} from '../../../shared/type-guards/active-map-item-type.type-guard';

@Component({
  selector: 'map-attribute-filter',
  templateUrl: './map-attribute-filter.component.html',
  styleUrls: ['./map-attribute-filter.component.scss']
})
export class MapAttributeFilterComponent implements OnInit, OnDestroy {
  public mapAttributeFiltersItem: ActiveMapItem<Gb2WmsMapItemConfiguration> | undefined;

  private readonly subscriptions: Subscription = new Subscription();
  private readonly mapAttributeFiltersItem$ = this.store.select(selectMapAttributeFiltersItemId);
  private readonly activeMapItems$ = this.store.select(selectActiveMapItems);

  constructor(private readonly store: Store) {}

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public close() {
    this.store.dispatch(MapAttributeFiltersItemActions.clearMapAttributeFiltersItemId());
  }

  public updateFilter(filterConfigParameter: string, filterValueName: string, checked: boolean) {
    if (this.mapAttributeFiltersItem) {
      this.store.dispatch(
        ActiveMapItemActions.setAttributeFilterValueState({
          isFilterValueActive: !checked, // not checked means the filter is active
          filterValueName: filterValueName,
          attributeFilterParameter: filterConfigParameter,
          activeMapItem: this.mapAttributeFiltersItem
        })
      );
    }
  }

  private handleMapAttributeFiltersItemChange(
    mapAttributeFiltersItemId: string | undefined,
    activeMapItems: ActiveMapItem<Gb2WmsMapItemConfiguration>[]
  ) {
    let mapAttributeFiltersItem;
    if (mapAttributeFiltersItemId !== undefined) {
      mapAttributeFiltersItem = activeMapItems.find((activeMapItem) => activeMapItem.id === mapAttributeFiltersItemId);
      if (mapAttributeFiltersItem === undefined) {
        // the map attribute filters item ID is still set but the corresponding item is not active anymore => close this component
        this.close();
      }
    }
    this.mapAttributeFiltersItem = mapAttributeFiltersItem;
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.mapAttributeFiltersItem$
        .pipe(
          concatLatestFrom(() => this.activeMapItems$),
          tap(([activeMapItemId, activeMapItems]) => {
            const gb2WmsMapItems = activeMapItems.filter(isActiveMapItemOfType(Gb2WmsMapItemConfiguration));
            this.handleMapAttributeFiltersItemChange(activeMapItemId, gb2WmsMapItems);
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.activeMapItems$
        .pipe(
          tap((activeMapItems) => {
            const gb2WmsMapItems = activeMapItems.filter(isActiveMapItemOfType(Gb2WmsMapItemConfiguration));
            this.handleMapAttributeFiltersItemChange(this.mapAttributeFiltersItem?.id, gb2WmsMapItems);
          })
        )
        .subscribe()
    );
  }
}
