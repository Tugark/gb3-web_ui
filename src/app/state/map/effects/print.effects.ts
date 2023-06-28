import {Inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {EMPTY, switchMap} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {PrintActions} from '../actions/print.actions';
import {Gb3PrintService} from '../../../shared/services/apis/gb3/gb3-print.service';
import {DOCUMENT} from '@angular/common';

@Injectable()
export class PrintEffects {
  public dispatchPrintInfoRequest$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PrintActions.loadPrintInfo),
      switchMap(() =>
        this.printService.loadPrintInfo().pipe(
          map((printInfo) => {
            return PrintActions.setPrintInfo({printInfo});
          }),
          catchError(() => EMPTY) // todo error handling
        )
      )
    );
  });

  public dispatchPrintCreationRequest$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PrintActions.requestPrintCreation),
      switchMap((value) =>
        this.printService.createPrintJob(value.printCreation).pipe(
          map((printCreationResponse) => {
            return PrintActions.setPrintCreationResponse({printCreationResponse});
          }),
          catchError(() => EMPTY) // todo error handling
        )
      )
    );
  });

  public dispatchPrintCreationResponseRequest$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PrintActions.setPrintCreationResponse),
      map((value) => {
        this.document.defaultView?.window.open(value.printCreationResponse.getURL, '_blank');
        return PrintActions.clearPrintCreation();
      })
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly printService: Gb3PrintService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}
}