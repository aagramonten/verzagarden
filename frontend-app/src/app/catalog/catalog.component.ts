import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant } from '../services/plant.service';
import { PlantCardComponent } from '../plant-card.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent],
  template: `
    <!-- HEADER -->
    <header style="background:#14452F;color:white;display:flex;justify-content:space-between;align-items:center;padding:12px 20px;position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(20,69,47,0.18);">
      <button (click)="toggleLanguage()" style="background:none;border:1px solid #A3C4B3;color:white;border-radius:8px;padding:5px 10px;cursor:pointer;font-weight:bold;font-size:0.8rem;">
        {{ isEnglish ? 'ES' : 'EN' }}
      </button>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:1.5rem;">🌿</span>
        <div style="text-align:center;">
          <h1 style="margin:0;font-size:1.2rem;font-weight:600;color:white;">Verde Vida</h1>
          <p style="margin:0;font-size:0.7rem;color:#A3C4B3;">Plantas y Jardines</p>
        </div>
      </div>
      <button (click)="goToAdmin()" style="background:none;border:none;color:white;cursor:pointer;padding:5px;display:flex;align-items:center;flex-direction:column;">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span style="font-size:0.6rem;margin-top:2px;">Admin</span>
      </button>
    </header>

    <!-- SEARCH + FILTERS -->
    <section style="background:white;padding:15px 20px;border-bottom:1px solid #E0E0E0;">
      <div style="display:flex;align-items:center;background:#F0F2F0;border-radius:25px;padding:10px 15px;margin-bottom:15px;">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#888" stroke-width="2" fill="none" style="margin-right:10px;min-width:20px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" [(ngModel)]="search" placeholder="Buscar plantas..." style="flex:1;border:none;background:transparent;font-size:1rem;outline:none;color:#333;">
        <a [href]="getGeneralWhatsappLink()" target="_blank" style="color:#2B7A3E;border:none;background:none;padding:0;cursor:pointer;display:flex;align-items:center;margin-left:10px;">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </a>
      </div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:5px;scrollbar-width:none;">
        <button *ngFor="let cat of categories" (click)="selectedCategory = cat"
          style="border:1px solid transparent;padding:8px 16px;border-radius:20px;font-size:0.9rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all 0.3s;"
          [style.backgroundColor]="selectedCategory === cat ? '#14452F' : '#F0F2F0'"
          [style.color]="selectedCategory === cat ? 'white' : '#666'">
          {{ cat }}
        </button>
      </div>
    </section>

    <!-- HERO -->
    <section style="background:#fafdf8;padding:20px;">
      <div style="display:flex;gap:20px;max-width:1200px;width:100%;flex-wrap:wrap;margin:0 auto;">
        <div style="flex:1 1 300px;background:white;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(16,35,25,0.04);border:1px solid #eef1ec;">
          <span style="color:#1f7a4d;font-weight:700;font-size:0.85rem;letter-spacing:1px;">INVENTARIO DISPONIBLE</span>
          <h1 style="font-size:2.4rem;margin-top:10px;margin-bottom:15px;color:#102319;letter-spacing:-1px;line-height:1.1;">{{ client?.business_name || 'Verde Vida' }}</h1>
          <p style="font-size:1rem;margin-bottom:24px;color:#516052;">Explora plantas disponibles, precios actualizados y ordena directo por WhatsApp.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div style="background:#f4f8f1;padding:16px;border-radius:16px;flex:1;min-width:80px;text-align:center;">
              <h2 style="font-size:1.8rem;color:#102319;margin:0 0 4px 0;">{{ plants.length }}</h2>
              <span style="font-size:0.75rem;color:#516052;font-weight:600;">Plantas</span>
            </div>
            <div style="background:#f4f8f1;padding:16px;border-radius:16px;flex:1;min-width:80px;text-align:center;">
              <h2 style="font-size:1.8rem;color:#102319;margin:0 0 4px 0;">{{ categories.length - 1 }}</h2>
              <span style="font-size:0.75rem;color:#516052;font-weight:600;">Categorías</span>
            </div>
            <div style="background:#f4f8f1;padding:16px;border-radius:16px;flex:1;min-width:80px;text-align:center;">
              <h2 style="font-size:1.8rem;color:#102319;margin:0 0 4px 0;">{{ filteredPlants.length }}</h2>
              <span style="font-size:0.75rem;color:#516052;font-weight:600;">Disponibles</span>
            </div>
          </div>
        </div>
        <div style="flex:1 1 300px;background:linear-gradient(135deg,#1f7a4d,#145635);border-radius:24px;padding:32px;color:white;display:flex;flex-direction:column;justify-content:center;box-shadow:0 10px 30px rgba(31,122,77,0.2);">
          <span style="background:rgba(255,255,255,0.15);padding:6px 14px;border-radius:99px;font-size:0.75rem;font-weight:800;width:fit-content;margin-bottom:20px;letter-spacing:1px;">ORDEN RÁPIDO</span>
          <h2 style="font-size:2.2rem;line-height:1.1;margin:0 0 15px 0;font-weight:900;letter-spacing:-1px;">Compra por<br>WhatsApp</h2>
          <p style="font-size:0.95rem;color:rgba(255,255,255,0.85);line-height:1.5;margin:0;">El cliente escoge la planta y te escribe con el detalle automático.</p>
        </div>
      </div>
    </section>

    <!-- CATALOG GRID -->
    <section style="max-width:1200px;margin:0 auto;padding:0 20px 40px;">
      <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;font-weight:600;font-size:1.1rem;">🌱 Cargando catálogo...</div>
      <div class="plant-grid" *ngIf="!loading">
        <app-plant-card *ngFor="let p of filteredPlants" [plant]="p" [adminMode]="false" [client]="client"></app-plant-card>
        <div *ngIf="filteredPlants.length === 0" style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
          No se encontraron plantas que coincidan con la búsqueda.
        </div>
      </div>
    </section>

    <!-- LOGIN MODAL -->
    <div *ngIf="showLoginModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:24px;padding:32px;width:100%;max-width:400px;box-shadow:0 24px 70px rgba(0,0,0,0.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h2 style="margin:0;color:#102319;font-size:1.5rem;">Acceso Admin</h2>
          <button (click)="showLoginModal = false" style="border:none;background:#f4f8f1;border-radius:99px;width:36px;height:36px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <input type="text" placeholder="Usuario" [(ngModel)]="loginUsername" style="padding:14px 16px;border-radius:12px;border:1px solid #dfe7dd;font-size:1rem;outline:none;width:100%;box-sizing:border-box;">
          <input type="password" placeholder="Contraseña" [(ngModel)]="loginPassword" (keyup.enter)="submitLogin()" style="padding:14px 16px;border-radius:12px;border:1px solid #dfe7dd;font-size:1rem;outline:none;width:100%;box-sizing:border-box;">
          <div *ngIf="loginError" style="color:#c5221f;font-size:0.9rem;font-weight:600;">{{ loginError }}</div>
          <button (click)="submitLogin()" [disabled]="loginLoading" style="background:#1f7a4d;color:white;padding:14px;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;">
            {{ loginLoading ? 'Verificando...' : 'Entrar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CatalogComponent implements OnInit {
  isEnglish = false;
  clientSlug = 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  search = '';
  selectedCategory = 'Todas';
  loading = true;

  showLoginModal = false;
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  loginLoading = false;

  constructor(
    private plantService: PlantService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Si viene con ?login=true abrir modal automáticamente
    if (window.location.search.includes('login=true')) {
      this.showLoginModal = true;
      window.history.replaceState({}, '', '/');
    }
    this.loadData();
  }

  loadData() {
    this.plantService.getPlants(this.clientSlug).subscribe({
      next: plants => { this.plants = [...plants]; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; }
    });
    this.plantService.getClient(this.clientSlug).subscribe({
      next: client => { this.client = { ...client }; this.cdr.detectChanges(); },
      error: err => console.error(err)
    });
  }

  toggleLanguage() { this.isEnglish = !this.isEnglish; }

  goToAdmin() {
    if (sessionStorage.getItem('admin_slug') === this.clientSlug) {
      this.router.navigate(['/admin']);
    } else {
      this.showLoginModal = true;
      this.loginError = '';
    }
  }

  submitLogin() {
    if (!this.loginUsername || !this.loginPassword) return;
    this.loginLoading = true;
    this.loginError = '';
    this.plantService.login(this.clientSlug, this.loginUsername, this.loginPassword).subscribe({
      next: () => {
        sessionStorage.setItem('admin_slug', this.clientSlug);
        this.loginLoading = false;
        this.showLoginModal = false;
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.loginError = 'Usuario o contraseña incorrectos';
        this.loginLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get categories() {
    return ['Todas', ...new Set(this.plants.map(p => p.category || 'Sin categoría'))];
  }

  get filteredPlants() {
    const term = this.search.toLowerCase().trim();
    return this.plants.filter(plant => {
      const matchSearch = !term || plant.name.toLowerCase().includes(term) || (plant.description || '').toLowerCase().includes(term);
      const matchCategory = this.selectedCategory === 'Todas' || plant.category === this.selectedCategory;
      return matchSearch && matchCategory;
    });
  }

  getGeneralWhatsappLink(): string {
    const phone = this.client?.whatsapp_number || '19392360534';
    return `https://wa.me/${phone}?text=${encodeURIComponent('Hola, me gustaría hacer una consulta general sobre el inventario.')}`;
  }
}