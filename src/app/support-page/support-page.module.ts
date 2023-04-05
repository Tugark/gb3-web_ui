import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SupportPageComponent} from './support-page.component';
import {SupportPageRoutingModule} from './support-page-routing.module';
import {SharedModule} from '../shared/shared.module';
import {FaqComponent} from './components/faq/faq.component';
import {ContactComponent} from './components/contact/contact.component';
import {UsefulLinksComponent} from './components/useful-links/useful-links.component';

@NgModule({
  declarations: [SupportPageComponent, FaqComponent, ContactComponent, UsefulLinksComponent],
  imports: [CommonModule, SharedModule, SupportPageRoutingModule]
})
export class SupportPageModule {}
