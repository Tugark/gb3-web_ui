import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../shared/types/loading-state';
import {Store} from '@ngrx/store';
import {Subscription, tap} from 'rxjs';
import {HasSavingState} from '../../../shared/interfaces/has-saving-state.interface';
import {
  selectPrintCreationLoadingState,
  selectPrintCreationResponse,
  selectPrintInfo,
  selectPrintInfoLoadingState
} from '../../../state/map/reducers/print.reducer';
import {
  PrintCreation,
  PrintCreationLayer,
  PrintCreationResponse,
  PrintInfo,
  PrintOrientation
} from '../../../shared/interfaces/print.interface';
import {PrintActions} from '../../../state/map/actions/print.actions';
import {MapConfigState} from '../../../state/map/states/map-config.state';
import {selectMapConfigState} from '../../../state/map/reducers/map-config.reducer';
import {ActiveMapItem} from '../../models/active-map-item.model';
import {selectActiveMapItems} from '../../../state/map/reducers/active-map-item.reducer';
import {MapDrawingService} from '../../services/map-drawing.service';
import {MapConstants} from '../../../shared/constants/map.constants';
import {BasemapConfigService} from '../../services/basemap-config.service';

interface PrintForm {
  title: FormControl<string | null>;
  comment: FormControl<string | null>;
  layoutSize: FormControl<string | null>;
  layoutOrientation: FormControl<PrintOrientation | null>;
  dpi: FormControl<number | null>;
  rotation: FormControl<number | null>;
  scale: FormControl<number | null>;
  outputFormat: FormControl<string | null>;
  showLegend: FormControl<boolean | null>;
  printActiveMapsSeparately: FormControl<boolean | null>;
}

@Component({
  selector: 'print-dialog',
  templateUrl: './print-dialog.component.html',
  styleUrls: ['./print-dialog.component.scss']
})
export class PrintDialogComponent implements OnInit, OnDestroy, HasSavingState {
  public readonly formGroup: FormGroup<PrintForm> = new FormGroup({
    title: new FormControl(),
    comment: new FormControl(),
    layoutSize: new FormControl('', [Validators.required]),
    layoutOrientation: new FormControl(),
    dpi: new FormControl(0, [Validators.required]),
    rotation: new FormControl(0, [Validators.min(-90), Validators.max(90)]),
    scale: new FormControl(0, [Validators.required]),
    outputFormat: new FormControl('', [Validators.required]),
    showLegend: new FormControl(false, [Validators.required]),
    printActiveMapsSeparately: new FormControl(false, [Validators.required])
  });

  public savingState: LoadingState = 'undefined';
  public printInfo?: PrintInfo;
  public printInfoLoadingState: LoadingState = 'undefined';
  public printCreationResponse?: PrintCreationResponse;
  public mapConfigState?: MapConfigState;
  public activeMapItems?: ActiveMapItem[];
  public uniqueLayoutSizes: string[] = [];

  private readonly subscriptions: Subscription = new Subscription();

  constructor(
    private readonly store: Store,
    private readonly mapDrawingService: MapDrawingService,
    private readonly basemapConfigService: BasemapConfigService
  ) {
    this.formGroup.disable();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.mapDrawingService.clearPrintAreaHighlight();
  }

  public ngOnInit() {
    this.initSubscriptions();
    this.store.dispatch(PrintActions.loadPrintInfo());
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.store
        .select(selectPrintInfoLoadingState)
        .pipe(
          tap((printInfoLoadingState) => {
            this.printInfoLoadingState = printInfoLoadingState;
            this.updateFormGroupState();
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.store
        .select(selectPrintInfo)
        .pipe(
          tap((printInfo) => {
            this.printInfo = printInfo;
            this.initializeDefaultFormValues(printInfo);
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.store
        .select(selectPrintCreationLoadingState)
        .pipe(
          tap((printCreationLoadingState) => {
            this.savingState = printCreationLoadingState;
            this.updateFormGroupState();
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.store
        .select(selectPrintCreationResponse)
        .pipe(
          tap((printCreationResponse) => {
            this.printCreationResponse = printCreationResponse;
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.store
        .select(selectMapConfigState)
        .pipe(
          tap((mapConfigState) => {
            this.mapConfigState = mapConfigState;
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.formGroup.valueChanges
        .pipe(
          tap(() => {
            this.updateFormGroupControlsState();
          })
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.store
        .select(selectActiveMapItems)
        .pipe(
          tap((activeMapItems) => {
            this.activeMapItems = activeMapItems;
          })
        )
        .subscribe()
    );
  }

  private updateFormGroupState() {
    if (this.printInfoLoadingState !== 'loaded' || this.savingState === 'loading') {
      this.formGroup.disable();
    } else {
      this.formGroup.enable();
      this.updateFormGroupControlsState();
    }
  }

  private updateFormGroupControlsState(emitEvent = false) {
    if (this.formGroup.disabled) {
      return;
    }

    const formGroupValue = this.formGroup.value;
    const currentLayout = this.printInfo?.layouts.find((layout) => layout.size === formGroupValue.layoutSize);
    if (!currentLayout?.rotation) {
      this.formGroup.controls.rotation.disable({emitEvent});
    } else {
      this.formGroup.controls.rotation.enable({emitEvent});
    }
    if (!currentLayout?.orientation) {
      this.formGroup.controls.layoutOrientation.disable({emitEvent});
    } else {
      this.formGroup.controls.layoutOrientation.enable({emitEvent});
    }

    // TODO WES: remove the following two
    this.formGroup.controls.showLegend.disable({emitEvent});
    this.formGroup.controls.printActiveMapsSeparately.disable({emitEvent});
  }

  private initializeDefaultFormValues(printInfo: PrintInfo | undefined) {
    const defaultLayout = printInfo?.layouts[0];
    this.formGroup.setValue({
      title: '',
      comment: null,
      layoutSize: defaultLayout?.size ?? '',
      layoutOrientation: defaultLayout?.orientation ?? 'hoch',
      dpi: printInfo?.dpis[0]?.value ?? 0,
      rotation: null,
      scale: printInfo?.scales[0]?.value ?? 0,
      outputFormat: printInfo?.outputFormats[0]?.name ?? '',
      showLegend: false,
      printActiveMapsSeparately: false
    });
    this.uniqueLayoutSizes = printInfo ? [...new Set(printInfo.layouts.map((layout) => layout.size))] : [];
  }

  public close() {
    this.store.dispatch(PrintActions.setPrintDialogVisible({printDialogVisible: false}));
  }

  public print() {
    if (!this.formGroup.valid) {
      return;
    }

    const printCreation = this.createPrintCreation();
    this.store.dispatch(PrintActions.requestPrintCreation({printCreation}));
  }

  private createPrintCreation(): PrintCreation {
    // TODO WES: remove all the default values from this and replace them using the current active map items / map state / and so on
    const value = this.formGroup.value;

    return {
      units: 'm', // TODO WES: what?
      dpi: value.dpi! ?? 0,
      layoutSize: value.layoutSize ?? '',
      layoutOrientation: value.layoutOrientation ?? undefined,
      outputFormat: value.outputFormat ?? '',
      srs: `EPSG:${MapConstants.DEFAULT_SRS}`,
      layers: this.createPrintCreationLayers(),
      pages: [
        {
          scale: value.scale ?? 0,
          withLegend: value.showLegend ?? false,
          userTitle: value.title ?? '',
          userComment: value.comment ?? '',
          topicTitle: this.activeMapItems ? this.activeMapItems.map((activeMapItem) => activeMapItem.title).join(', ') : '',
          headerImg: 'http://127.0.0.1/images/LogoGIS.jpg', // TODO WES: what?
          center: [this.mapConfigState?.center.x ?? 0, this.mapConfigState?.center.y ?? 0],
          extent: [], // this seems to be optional
          rotation: value.rotation ?? 0,
          topic: '' // TODO WES: what?
        }
      ]
    };
  }

  private createPrintCreationLayers(): PrintCreationLayer[] {
    const layers: PrintCreationLayer[] = [];

    // add basemap
    const activeBasemapId = this.mapConfigState?.activeBasemapId;
    const activeBasemap = this.basemapConfigService.availableBasemaps.find((basemap) => basemap.id === activeBasemapId);
    if (activeBasemap) {
      switch (activeBasemap.type) {
        case 'blank':
          // a blank basemap does not have to be printed
          break;
        case 'wms':
          layers.push({
            layers: activeBasemap.layers.map((layer) => layer.name),
            type: 'WMS',
            opacity: 1,
            customParams: {
              dpi: 96, // TODO WES: what?
              transparent: true, // TODO WES: what?
              format: 'image/png; mode=8bit' // TODO WES: what?
            },
            format: 'image/png; mode=8bit', // TODO WES: what?
            styles: [''], // TODO WES: what?
            singleTile: true, // TODO WES: what?
            baseURL: activeBasemap.url
          });
          break;
      }
    }

    // add all active map items
    if (this.activeMapItems) {
      this.activeMapItems.forEach((activeMapItem) => {
        switch (activeMapItem.settings.type) {
          case 'drawing':
            throw new Error('Printing drawings is not implemented yet.');
            break;
          case 'gb2Wms':
            layers.push({
              layers: activeMapItem.settings.layers.map((layer) => layer.layer),
              type: 'WMS',
              opacity: activeMapItem.opacity,
              customParams: {
                dpi: 96, // TODO WES: what?
                transparent: true, // TODO WES: what?
                format: 'image/png; mode=8bit' // TODO WES: what?
              },
              format: 'image/png; mode=8bit', // TODO WES: what?
              styles: [''], // TODO WES: what?
              singleTile: true, // TODO WES: what?
              baseURL: activeMapItem.settings.url
            });
            break;
        }
      });
    }

    // reverse the order as the print API uses an inverse positioning to draw them
    return layers.map((layer, index, array) => array[array.length - 1 - index]);
  }
}
