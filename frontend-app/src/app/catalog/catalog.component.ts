import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant } from '../services/plant.service';
import { PlantCardComponent } from '../plant-card.component';

const CATEGORIES = [
  { name: 'Árboles',             emoji: '🌳', desc: 'Plantas grandes con un tronco principal leñoso que se ramifica a cierta altura.', ideal: 'Sombra, estructura y jardines amplios.' },
  { name: 'Arbustos',            emoji: '🌿', desc: 'Plantas medianas con varios tallos leñosos que crecen desde la base.',             ideal: 'Bordes, divisiones naturales y jardines frondosos.' },
  { name: 'Flores de estación',  emoji: '🌸', desc: 'Plantas que florecen en épocas específicas del año y aportan color al jardín.',   ideal: 'Renovar espacios según la temporada.' },
  { name: 'Plantas de interior', emoji: '🪴', desc: 'Plantas que se adaptan bien a espacios interiores con luz y humedad controladas.', ideal: 'Hogares, oficinas y decoración interior.' },
  { name: 'Trepadoras',          emoji: '🌱', desc: 'Plantas que necesitan soporte para crecer hacia arriba.',                         ideal: 'Cubrir paredes, crear sombra y añadir privacidad.' },
  { name: 'Suculentas',          emoji: '🌵', desc: 'Plantas que almacenan agua en hojas, tallos o raíces, toleran mejor la sequía.',  ideal: 'Bajo mantenimiento y espacios soleados.' },
  { name: 'Orquídeas',           emoji: '🌺', desc: 'Plantas ornamentales conocidas por sus flores elegantes y llamativas.',            ideal: 'Decoración fina, regalos y espacios con luz indirecta.' },
  { name: 'Palmas',              emoji: '🌴', desc: 'Plantas tropicales que aportan altura, elegancia y sensación caribeña.',          ideal: 'Entradas, patios, terrazas y jardines tropicales.' },
];

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent],
  styles: [`
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    @media (max-width: 768px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 400px) { .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
    .cat-card {
      background: white; border: 1px solid #eef1ec; border-radius: 16px;
      padding: 14px; cursor: pointer; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 6px;
    }
    .cat-card:hover { box-shadow: 0 6px 20px rgba(16,35,25,0.08); transform: translateY(-2px); }
    .cat-card.active { border-color: #14452F; background: #f0faf4; }
    .cat-emoji { font-size: 1.6rem; line-height: 1; }
    .cat-name { font-weight: 700; color: #102319; font-size: 0.88rem; }
    .cat-desc { font-size: 0.74rem; color: #516052; line-height: 1.4; }
    .cat-ideal { font-size: 0.7rem; color: #1f7a4d; font-weight: 600; }
    .cat-btn {
      margin-top: 6px; background: none; border: 1px solid #dfe7dd;
      color: #14452F; border-radius: 8px; padding: 5px 10px;
      font-size: 0.72rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s; width: fit-content;
    }
    .cat-card.active .cat-btn { background: #14452F; color: white; border-color: #14452F; }
    .cat-card:hover .cat-btn { background: #14452F; color: white; border-color: #14452F; }
    .filter-pill {
      border: 1px solid transparent; padding: 7px 14px; border-radius: 20px;
      font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s;
    }
  `],
  template: `
    <!-- HEADER -->
    <header style="background:#14452F;color:white;display:flex;justify-content:space-between;align-items:center;padding:12px 20px;position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(20,69,47,0.18);">
      <button (click)="toggleLanguage()" style="background:none;border:1px solid #A3C4B3;color:white;border-radius:8px;padding:5px 10px;cursor:pointer;font-weight:bold;font-size:0.8rem;">
        {{ isEnglish ? 'ES' : 'EN' }}
      </button>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:1.4rem;">🌿</span>
        <div style="text-align:center;">
          <h1 style="margin:0;font-size:1.1rem;font-weight:700;color:white;">Demo Garden PR</h1>
          <p style="margin:0;font-size:0.68rem;color:#A3C4B3;">Plantas y Jardines</p>
        </div>
      </div>
      <button (click)="goToAdmin()" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);border-radius:8px;padding:5px 12px;cursor:pointer;font-size:0.75rem;font-weight:500;">
        Admin
      </button>
    </header>

    <!-- SEARCH + FILTER PILLS -->
    <section style="background:white;padding:12px 20px;border-bottom:1px solid #E0E0E0;">
      <div style="display:flex;align-items:center;background:#F0F2F0;border-radius:25px;padding:9px 14px;margin-bottom:11px;">
        <svg viewBox="0 0 24 24" width="17" height="17" stroke="#888" stroke-width="2" fill="none" style="margin-right:9px;min-width:17px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" [(ngModel)]="search" placeholder="Buscar plantas..." style="flex:1;border:none;background:transparent;font-size:0.92rem;outline:none;color:#333;">
        <a [href]="getGeneralWhatsappLink()" target="_blank" style="color:#2B7A3E;border:none;background:none;padding:0;cursor:pointer;display:flex;align-items:center;margin-left:10px;">
          <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </a>
      </div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">
        <button class="filter-pill" (click)="setCategory('Todas')"
          [style.backgroundColor]="selectedCategory === 'Todas' ? '#14452F' : '#F0F2F0'"
          [style.color]="selectedCategory === 'Todas' ? 'white' : '#666'">
          Todas
        </button>
        <button *ngFor="let cat of CATEGORIES" class="filter-pill" (click)="setCategory(cat.name)"
          [style.backgroundColor]="selectedCategory === cat.name ? '#14452F' : '#F0F2F0'"
          [style.color]="selectedCategory === cat.name ? 'white' : '#666'">
          {{ cat.emoji }} {{ cat.name }}
        </button>
      </div>
    </section>

    <!-- HERO COMPACTO -->
    <section style="background:#fafdf8;padding:14px 20px 0;">
      <div style="display:flex;gap:14px;max-width:1200px;width:100%;flex-wrap:wrap;margin:0 auto;">
        <div style="flex:1 1 260px;background:white;border-radius:20px;padding:18px 20px;box-shadow:0 6px 20px rgba(16,35,25,0.04);border:1px solid #eef1ec;">
          <span style="color:#1f7a4d;font-weight:700;font-size:0.75rem;letter-spacing:1px;">INVENTARIO DISPONIBLE</span>
          <h1 style="font-size:1.7rem;margin:6px 0 8px;color:#102319;letter-spacing:-0.5px;line-height:1.1;">Demo Garden PR</h1>
          <p style="font-size:0.85rem;margin-bottom:14px;color:#516052;">Explora plantas disponibles y ordena directo por WhatsApp.</p>
          <div style="display:flex;gap:8px;">
            <div style="background:#f4f8f1;padding:10px;border-radius:12px;flex:1;text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:#102319;line-height:1;">{{ plants.length }}</div>
              <div style="font-size:0.68rem;color:#516052;font-weight:600;margin-top:2px;">Plantas</div>
            </div>
            <div style="background:#f4f8f1;padding:10px;border-radius:12px;flex:1;text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:#102319;line-height:1;">{{ activeCategoryCount }}</div>
              <div style="font-size:0.68rem;color:#516052;font-weight:600;margin-top:2px;">Categorías</div>
            </div>
            <div style="background:#f4f8f1;padding:10px;border-radius:12px;flex:1;text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:#102319;line-height:1;">{{ filteredPlants.length }}</div>
              <div style="font-size:0.68rem;color:#516052;font-weight:600;margin-top:2px;">Disponibles</div>
            </div>
          </div>
        </div>
        <div style="flex:1 1 200px;background:linear-gradient(135deg,#1f7a4d,#145635);border-radius:20px;padding:18px 22px;color:white;display:flex;flex-direction:column;justify-content:center;box-shadow:0 8px 24px rgba(31,122,77,0.2);">
          <span style="background:rgba(255,255,255,0.15);padding:4px 11px;border-radius:99px;font-size:0.68rem;font-weight:800;width:fit-content;margin-bottom:10px;letter-spacing:1px;">ORDEN RÁPIDO</span>
          <h2 style="font-size:1.4rem;line-height:1.1;margin:0 0 7px;font-weight:900;">Consulta por<br>WhatsApp</h2>
          <p style="font-size:0.8rem;color:rgba(255,255,255,0.8);line-height:1.4;margin:0;">Escoge la planta y te respondemos de inmediato.</p>
        </div>
      </div>
    </section>

    <!-- EXPLORA POR CATEGORÍA -->
    <section style="max-width:1200px;margin:0 auto;padding:18px 20px 0;">
      <div style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem;font-weight:700;color:#102319;margin:0 0 4px;">Explora por categoría</h2>
        <p style="font-size:0.8rem;color:#516052;margin:0;">Conoce los tipos de plantas disponibles y encuentra más rápido la opción ideal para tu espacio.</p>
      </div>

      <div class="cat-grid" style="margin-bottom:16px;">
        <div *ngFor="let cat of CATEGORIES" class="cat-card" [class.active]="selectedCategory === cat.name" (click)="setCategory(cat.name)">
          <div class="cat-emoji">{{ cat.emoji }}</div>
          <div class="cat-name">{{ cat.name }}</div>
          <div class="cat-desc">{{ cat.desc }}</div>
          <div class="cat-ideal">Ideal para: {{ cat.ideal }}</div>
          <button class="cat-btn" (click)="$event.stopPropagation(); setCategory(cat.name)">Ver plantas</button>
        </div>
      </div>

      <!-- Dato curioso -->
      <div style="background:linear-gradient(135deg,#f0faf4,#fafdf8);border:1px solid #d4edda;border-radius:16px;padding:16px 20px;margin-bottom:4px;display:flex;gap:14px;align-items:flex-start;">
        <span style="font-size:1.6rem;flex-shrink:0;">🌿</span>
        <div>
          <div style="font-weight:700;color:#14452F;font-size:0.85rem;margin-bottom:5px;">Dato curioso</div>
          <p style="font-size:0.8rem;color:#516052;line-height:1.55;margin:0;">
            ¿Sabías que no es lo mismo un árbol que un arbusto? Los árboles tienen un solo tronco principal y leñoso que se ramifica a cierta altura, mientras que los arbustos poseen múltiples tallos leñosos que se ramifican desde la misma base.
          </p>
        </div>
      </div>
    </section>

    <!-- CATALOG GRID -->
    <section id="catalogo" style="max-width:1200px;margin:0 auto;padding:16px 20px 40px;">
      <div *ngIf="selectedCategory !== 'Todas'" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:0.9rem;font-weight:600;color:#102319;">
          {{ getCatEmoji(selectedCategory) }} {{ selectedCategory }}
          <span style="color:#516052;font-weight:400;"> — {{ filteredPlants.length }} plantas</span>
        </div>
        <button (click)="setCategory('Todas')" style="background:none;border:1px solid #dfe7dd;color:#516052;border-radius:8px;padding:4px 10px;font-size:0.75rem;cursor:pointer;">
          Ver todas ✕
        </button>
      </div>

      <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;font-weight:600;">🌱 Cargando catálogo...</div>

      <div class="plant-grid" *ngIf="!loading && filteredPlants.length > 0">
        <app-plant-card *ngFor="let p of filteredPlants" [plant]="p" [adminMode]="false" [client]="client"></app-plant-card>
      </div>

      <div *ngIf="!loading && filteredPlants.length === 0" style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:32px 24px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">🌱</div>
        <div style="font-weight:700;color:#102319;margin-bottom:8px;">No hay plantas disponibles en esta categoría por el momento.</div>
        <p style="color:#516052;font-size:0.88rem;margin-bottom:16px;">Escríbenos por WhatsApp para consultar disponibilidad.</p>
        <a [href]="getGeneralWhatsappLink()" target="_blank" style="background:#14452F;color:white;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:0.88rem;display:inline-flex;align-items:center;gap:7px;">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Consultar por WhatsApp
        </a>
      </div>
    </section>

    <!-- LOGIN MODAL -->
    <div *ngIf="showLoginModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:24px;padding:32px;width:100%;max-width:400px;box-shadow:0 24px 70px rgba(0,0,0,0.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h2 style="margin:0;color:#102319;font-size:1.4rem;">Acceso Admin</h2>
          <button (click)="showLoginModal = false" style="border:none;background:#f4f8f1;border-radius:99px;width:36px;height:36px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <input type="text" placeholder="Usuario" [(ngModel)]="loginUsername" style="padding:13px 15px;border-radius:12px;border:1px solid #dfe7dd;font-size:0.95rem;outline:none;width:100%;box-sizing:border-box;">
          <input type="password" placeholder="Contraseña" [(ngModel)]="loginPassword" (keyup.enter)="submitLogin()" style="padding:13px 15px;border-radius:12px;border:1px solid #dfe7dd;font-size:0.95rem;outline:none;width:100%;box-sizing:border-box;">
          <div *ngIf="loginError" style="color:#c5221f;font-size:0.88rem;font-weight:600;">{{ loginError }}</div>
          <button (click)="submitLogin()" [disabled]="loginLoading" style="background:#14452F;color:white;padding:13px;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;">
            {{ loginLoading ? 'Verificando...' : 'Entrar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CatalogComponent implements OnInit {
  readonly CATEGORIES = CATEGORIES;

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

  constructor(private plantService: PlantService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
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

  setCategory(cat: string) {
    this.selectedCategory = cat;
    setTimeout(() => {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  getCatEmoji(name: string): string {
    return CATEGORIES.find(c => c.name === name)?.emoji || '';
  }

  get activeCategoryCount(): number {
    const cats = new Set(this.plants.map(p => p.category).filter(Boolean));
    return cats.size;
  }

  get filteredPlants() {
    const term = this.search.toLowerCase().trim();
    return this.plants.filter(p => {
      const matchSearch = !term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
      const matchCat = this.selectedCategory === 'Todas' || p.category === this.selectedCategory;
      return matchSearch && matchCat;
    });
  }

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

  getGeneralWhatsappLink(): string {
    const phone = this.client?.whatsapp_number || '19392360534';
    return `https://wa.me/${phone}?text=${encodeURIComponent('Hola, me gustaría consultar sobre el inventario.')}`;
  }
}