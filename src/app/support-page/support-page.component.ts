import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription, tap} from 'rxjs';
import {ScreenMode} from '../shared/types/screen-size.type';
import {selectScreenMode} from '../state/app/reducers/app-layout.reducer';
import {LinksGroup} from '../shared/interfaces/links-group.interface';
import {selectAdditionalInformationLinks} from '../state/support/reducers/support-content.reducer';

const SUPPORT_PAGE_SUMMARY =
  'Hier werden häufig gestellte Fragen und deren Antworten aufgelistet. Sie haben die Möglichkeit, eine Supportanfrage zu stellen und finden weitere hilfreiche Informationen.';

@Component({
  selector: 'support-page',
  templateUrl: './support-page.component.html',
  styleUrls: ['./support-page.component.scss'],
  standalone: false,
})
export class SupportPageComponent implements OnInit, OnDestroy {
  public heroText = SUPPORT_PAGE_SUMMARY;
  public screenMode: ScreenMode = 'regular';
  public additionalInformationLinksGroups: LinksGroup[] = [];

  private readonly screenMode$ = this.store.select(selectScreenMode);
  private readonly additionalInformationLinksGroups$ = this.store.select(selectAdditionalInformationLinks);
  private readonly subscriptions: Subscription = new Subscription();

  constructor(private readonly store: Store) {}

  public ngOnInit(): void {
    this.subscriptions.add(this.screenMode$.pipe(tap((screenMode) => (this.screenMode = screenMode))).subscribe());
    this.subscriptions.add(
      this.additionalInformationLinksGroups$.pipe(tap((linksGroups) => (this.additionalInformationLinksGroups = linksGroups))).subscribe(),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
