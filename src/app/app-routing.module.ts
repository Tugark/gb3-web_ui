import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainPage} from './shared/enums/main-page.enum';

const routes: Routes = [
  {
    path: '',
    children: [
      {path: MainPage.Auth, loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)},
      {path: MainPage.Maps, loadChildren: () => import('./map/map.module').then((m) => m.MapModule)},
      {path: MainPage.Data, loadChildren: () => import('./data-catalogue/data-catalogue.module').then((m) => m.DataCatalogueModule)},
      {path: MainPage.Support, loadChildren: () => import('./support-page/support-page.module').then((m) => m.SupportPageModule)},
      {path: MainPage.Start, loadChildren: () => import('./start-page/start-page.module').then((m) => m.StartPageModule)},
    ],
  },
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
