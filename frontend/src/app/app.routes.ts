import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { MainPage } from './components/main-page/main-page';

export const routes: Routes = [
  { path: 'workbook/:id', component: Home },
  { path: '', component: MainPage },
];
