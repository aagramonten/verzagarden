import { Routes } from '@angular/router';

// v2
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    canActivate: [() => {
      const slug = sessionStorage.getItem('admin_slug');
      if (slug) return true;
      window.location.href = '/?login=true';
      return false;
    }]
  },
  { path: '**', redirectTo: '' }
];