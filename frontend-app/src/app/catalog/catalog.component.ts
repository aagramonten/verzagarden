import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant } from '../services/plant.service';
import { PlantCardComponent } from '../plant-card.component';

// ── TRANSLATIONS ──────────────────────────────────────────────
const T = {
  es: {
    tagline: 'Plantas y Jardines',
    search: 'Buscar plantas...',
    all: 'Todas',
    available: 'INVENTARIO DISPONIBLE',
    heroTitle: 'Demo Garden PR',
    heroSub: 'Explora plantas disponibles y ordena directo por WhatsApp.',
    plants: 'Plantas',
    categories: 'Categorías',
    available2: 'Disponibles',
    quickOrder: 'ORDEN RÁPIDO',
    ctaTitle: 'Consulta por\nWhatsApp',
    ctaSub: 'Escoge la planta y te respondemos de inmediato.',
    exploreTitle: 'Explora por categoría',
    exploreSub: 'Conoce los tipos de plantas disponibles y encuentra más rápido la opción ideal para tu espacio.',
    viewPlants: 'Ver plantas',
    viewAll: 'Ver todas',
    loading: '🌱 Cargando catálogo...',
    noPlants: 'No hay plantas disponibles en esta categoría por el momento.',
    noPlantsSub: 'Escríbenos por WhatsApp para consultar disponibilidad.',
    consultWA: 'Consultar por WhatsApp',
    adminAccess: 'Acceso Admin',
    username: 'Usuario',
    password: 'Contraseña',
    wrongCredentials: 'Usuario o contraseña incorrectos',
    enter: 'Entrar',
    verifying: 'Verificando...',
    admin: 'Admin',
    catIdeal: 'Ideal para:',
    filterInterior: 'Interior',
    filterFlowers: 'Flores',
  },
  en: {
    tagline: 'Plants & Gardens',
    search: 'Search plants...',
    all: 'All',
    available: 'AVAILABLE INVENTORY',
    heroTitle: 'Demo Garden PR',
    heroSub: 'Browse available plants and order directly via WhatsApp.',
    plants: 'Plants',
    categories: 'Categories',
    available2: 'Available',
    quickOrder: 'QUICK ORDER',
    ctaTitle: 'Order via\nWhatsApp',
    ctaSub: 'Pick a plant and we\'ll respond right away.',
    exploreTitle: 'Browse by category',
    exploreSub: 'Learn about the types of plants available and find the perfect option for your space.',
    viewPlants: 'View plants',
    viewAll: 'View all',
    loading: '🌱 Loading catalog...',
    noPlants: 'No plants available in this category at the moment.',
    noPlantsSub: 'Message us on WhatsApp to check availability.',
    consultWA: 'Ask on WhatsApp',
    adminAccess: 'Admin Access',
    username: 'Username',
    password: 'Password',
    wrongCredentials: 'Incorrect username or password',
    enter: 'Sign in',
    verifying: 'Verifying...',
    admin: 'Admin',
    catIdeal: 'Ideal for:',
    filterInterior: 'Interior',
    filterFlowers: 'Flowers',
  }
};

// ── CATEGORIES ────────────────────────────────────────────────
const CATEGORIES_ES = [
  { name: 'Árboles',             nameEn: 'Trees',            emoji: '🌳', desc: 'Plantas grandes con un tronco principal leñoso que se ramifica a cierta altura.', descEn: 'Large plants with a single woody trunk that branches at a certain height.', ideal: 'Sombra, estructura y jardines amplios.', idealEn: 'Shade, structure and large gardens.' },
  { name: 'Arbustos',            nameEn: 'Shrubs',           emoji: '🌿', desc: 'Plantas medianas con varios tallos leñosos que crecen desde la base.',             descEn: 'Medium-sized plants with multiple woody stems growing from the base.',       ideal: 'Bordes, divisiones naturales y jardines frondosos.', idealEn: 'Borders, natural dividers and lush gardens.' },
  { name: 'Flores de estación',  nameEn: 'Seasonal Flowers', emoji: '🌸', desc: 'Plantas que florecen en épocas específicas del año y aportan color al jardín.',   descEn: 'Plants that bloom at specific times of year and add color to the garden.',  ideal: 'Renovar espacios según la temporada.', idealEn: 'Refreshing spaces according to the season.' },
  { name: 'Plantas de interior', nameEn: 'Indoor Plants',    emoji: '🪴', desc: 'Plantas que se adaptan bien a espacios interiores con luz y humedad controladas.', descEn: 'Plants that thrive indoors with controlled light and humidity.',              ideal: 'Hogares, oficinas y decoración interior.', idealEn: 'Homes, offices and interior décor.' },
  { name: 'Trepadoras',          nameEn: 'Climbers',         emoji: '🌱', desc: 'Plantas que necesitan soporte para crecer hacia arriba.',                         descEn: 'Plants that need support to grow upward.',                                   ideal: 'Cubrir paredes, crear sombra y añadir privacidad.', idealEn: 'Covering walls, creating shade and adding privacy.' },
  { name: 'Suculentas',          nameEn: 'Succulents',       emoji: '🌵', desc: 'Plantas que almacenan agua en hojas, tallos o raíces, toleran mejor la sequía.',  descEn: 'Plants that store water in leaves, stems or roots, tolerating drought well.', ideal: 'Bajo mantenimiento y espacios soleados.', idealEn: 'Low maintenance and sunny spaces.' },
  { name: 'Palmas',              nameEn: 'Palms',            emoji: '🌴', desc: 'Plantas tropicales que aportan altura, elegancia y sensación caribeña.',          descEn: 'Tropical plants that add height, elegance and a Caribbean feel.',            ideal: 'Entradas, patios, terrazas y jardines tropicales.', idealEn: 'Entrances, patios, terraces and tropical gardens.' },
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
          <p style="margin:0;font-size:0.68rem;color:#A3C4B3;">{{ t.tagline }}</p>
        </div>
      </div>
      <button (click)="goToAdmin()" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);border-radius:8px;padding:5px 12px;cursor:pointer;font-size:0.75rem;font-weight:500;">
        {{ t.admin }}
      </button>
    </header>

    <!-- SEARCH + FILTER PILLS -->
    <section style="background:white;padding:12px 20px;border-bottom:1px solid #E0E0E0;">
      <div style="display:flex;align-items:center;background:#F0F2F0;border-radius:25px;padding:9px 14px;margin-bottom:11px;">
        <svg viewBox="0 0 24 24" width="17" height="17" stroke="#888" stroke-width="2" fill="none" style="margin-right:9px;min-width:17px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" [(ngModel)]="search" [placeholder]="t.search" style="flex:1;border:none;background:transparent;font-size:0.92rem;outline:none;color:#333;">
        <a [href]="getGeneralWhatsappLink()" target="_blank" style="color:#2B7A3E;border:none;background:none;padding:0;cursor:pointer;display:flex;align-items:center;margin-left:10px;">
          <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </a>
      </div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">
        <button class="filter-pill" (click)="setCategory('Todas')"
          [style.backgroundColor]="selectedCategory === 'Todas' ? '#14452F' : '#F0F2F0'"
          [style.color]="selectedCategory === 'Todas' ? 'white' : '#666'">
          {{ t.all }}
        </button>
        <button *ngFor="let cat of CATEGORIES" class="filter-pill" (click)="setCategory(cat.name)"
          [style.backgroundColor]="selectedCategory === cat.name ? '#14452F' : '#F0F2F0'"
          [style.color]="selectedCategory === cat.name ? 'white' : '#666'">
          {{ cat.emoji }} {{ getFilterLabel(cat) }}
        </button>
      </div>
    </section>

    <!-- HERO COMPACTO -->
    <section style="background:#fafdf8;padding:14px 20px 0;">
      <div style="display:flex;gap:14px;max-width:1200px;width:100%;flex-wrap:wrap;margin:0 auto;">
        <div style="flex:1 1 260px;background:white;border-radius:20px;padding:18px 20px;box-shadow:0 6px 20px rgba(16,35,25,0.04);border:1px solid #eef1ec;">
          <span style="color:#1f7a4d;font-weight:700;font-size:0.75rem;letter-spacing:1px;">{{ t.available }}</span>
          <h1 style="font-size:1.7rem;margin:6px 0 8px;color:#102319;letter-spacing:-0.5px;line-height:1.1;">{{ t.heroTitle }}</h1>
          <p style="font-size:0.85rem;margin-bottom:14px;color:#516052;">{{ t.heroSub }}</p>
          <div style="display:flex;gap:8px;">
            <div style="background:#f4f8f1;padding:10px;border-radius:12px;flex:1;text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:#102319;line-height:1;">{{ plants.length }}</div>
              <div style="font-size:0.68rem;color:#516052;font-weight:600;margin-top:2px;">{{ t.plants }}</div>
            </div>
            <div style="background:#f4f8f1;padding:10px;border-radius:12px;flex:1;text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:#102319;line-height:1;">{{ activeCategoryCount }}</div>
              <div style="font-size:0.68rem;color:#516052;font-weight:600;margin-top:2px;">{{ t.categories }}</div>
            </div>
            <div style="background:#f4f8f1;padding:10px;border-radius:12px;flex:1;text-align:center;">
              <div style="font-size:1.4rem;font-weight:800;color:#102319;line-height:1;">{{ filteredPlants.length }}</div>
              <div style="font-size:0.68rem;color:#516052;font-weight:600;margin-top:2px;">{{ t.available2 }}</div>
            </div>
          </div>
        </div>
        <div style="flex:1 1 200px;background:linear-gradient(135deg,#1f7a4d,#145635);border-radius:20px;padding:18px 22px;color:white;display:flex;flex-direction:column;justify-content:center;box-shadow:0 8px 24px rgba(31,122,77,0.2);">
          <span style="background:rgba(255,255,255,0.15);padding:4px 11px;border-radius:99px;font-size:0.68rem;font-weight:800;width:fit-content;margin-bottom:10px;letter-spacing:1px;">{{ t.quickOrder }}</span>
          <h2 style="font-size:1.4rem;line-height:1.2;margin:0 0 7px;font-weight:900;white-space:pre-line;">{{ t.ctaTitle }}</h2>
          <p style="font-size:0.8rem;color:rgba(255,255,255,0.8);line-height:1.4;margin:0;">{{ t.ctaSub }}</p>
        </div>
      </div>
    </section>

    <!-- EXPLORA POR CATEGORÍA -->
    <section style="max-width:1200px;margin:0 auto;padding:18px 20px 0;">
      <div style="margin-bottom:14px;">
        <h2 style="font-size:1.1rem;font-weight:700;color:#102319;margin:0 0 4px;">{{ t.exploreTitle }}</h2>
        <p style="font-size:0.8rem;color:#516052;margin:0;">{{ t.exploreSub }}</p>
      </div>
      <div class="cat-grid" style="margin-bottom:16px;">
        <div *ngFor="let cat of CATEGORIES" class="cat-card" [class.active]="selectedCategory === cat.name" (click)="setCategory(cat.name)">
          <div class="cat-emoji">{{ cat.emoji }}</div>
          <div class="cat-name">{{ isEnglish ? cat.nameEn : cat.name }}</div>
          <div class="cat-desc">{{ isEnglish ? cat.descEn : cat.desc }}</div>
          <div class="cat-ideal">{{ t.catIdeal }} {{ isEnglish ? cat.idealEn : cat.ideal }}</div>
          <button class="cat-btn" (click)="$event.stopPropagation(); setCategory(cat.name)">{{ t.viewPlants }}</button>
        </div>
      </div>
    </section>

    <!-- CATALOG GRID -->
    <section id="catalogo" style="max-width:1200px;margin:0 auto;padding:16px 20px 40px;">
      <div *ngIf="selectedCategory !== 'Todas'" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:0.9rem;font-weight:600;color:#102319;">
          {{ getCatEmoji(selectedCategory) }} {{ getActiveCatName() }}
          <span style="color:#516052;font-weight:400;"> — {{ filteredPlants.length }} {{ t.plants.toLowerCase() }}</span>
        </div>
        <button (click)="setCategory('Todas')" style="background:none;border:1px solid #dfe7dd;color:#516052;border-radius:8px;padding:4px 10px;font-size:0.75rem;cursor:pointer;">
          {{ t.viewAll }} ✕
        </button>
      </div>

      <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;font-weight:600;">{{ t.loading }}</div>

      <div class="plant-grid" *ngIf="!loading && filteredPlants.length > 0">
        <app-plant-card *ngFor="let p of filteredPlants" [plant]="p" [adminMode]="false" [client]="client" [isEnglish]="isEnglish"></app-plant-card>
      </div>

      <div *ngIf="!loading && filteredPlants.length === 0" style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:32px 24px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:10px;">🌱</div>
        <div style="font-weight:700;color:#102319;margin-bottom:8px;">{{ t.noPlants }}</div>
        <p style="color:#516052;font-size:0.88rem;margin-bottom:16px;">{{ t.noPlantsSub }}</p>
        <a [href]="getGeneralWhatsappLink()" target="_blank" style="background:#14452F;color:white;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:0.88rem;display:inline-flex;align-items:center;gap:7px;">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          {{ t.consultWA }}
        </a>
      </div>
    </section>

    <!-- LOGIN MODAL -->
    <div *ngIf="showLoginModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:24px;padding:32px;width:100%;max-width:400px;box-shadow:0 24px 70px rgba(0,0,0,0.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h2 style="margin:0;color:#102319;font-size:1.4rem;">{{ t.adminAccess }}</h2>
          <button (click)="showLoginModal = false" style="border:none;background:#f4f8f1;border-radius:99px;width:36px;height:36px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <input type="text" [placeholder]="t.username" [(ngModel)]="loginUsername" style="padding:13px 15px;border-radius:12px;border:1px solid #dfe7dd;font-size:0.95rem;outline:none;width:100%;box-sizing:border-box;">
          <input type="password" [placeholder]="t.password" [(ngModel)]="loginPassword" (keyup.enter)="submitLogin()" style="padding:13px 15px;border-radius:12px;border:1px solid #dfe7dd;font-size:0.95rem;outline:none;width:100%;box-sizing:border-box;">
          <div *ngIf="loginError" style="color:#c5221f;font-size:0.88rem;font-weight:600;">{{ t.wrongCredentials }}</div>
          <button (click)="submitLogin()" [disabled]="loginLoading" style="background:#14452F;color:white;padding:13px;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;">
            {{ loginLoading ? t.verifying : t.enter }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CatalogComponent implements OnInit {
  readonly CATEGORIES = CATEGORIES_ES;

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

  get t() { return this.isEnglish ? T.en : T.es; }

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

  toggleLanguage() {
    this.isEnglish = !this.isEnglish;
    this.cdr.detectChanges();
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
    setTimeout(() => {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  getFilterLabel(cat: typeof CATEGORIES_ES[0]): string {
    if (this.isEnglish) {
      // Shorten long names for pills
      if (cat.nameEn === 'Seasonal Flowers') return 'Flowers';
      if (cat.nameEn === 'Indoor Plants') return 'Indoor';
      return cat.nameEn;
    }
    if (cat.name === 'Plantas de interior') return 'Interior';
    if (cat.name === 'Flores de estación') return 'Flores';
    return cat.name;
  }

  getCatEmoji(name: string): string {
    return CATEGORIES_ES.find(c => c.name === name)?.emoji || '';
  }

  getActiveCatName(): string {
    const cat = CATEGORIES_ES.find(c => c.name === this.selectedCategory);
    if (!cat) return this.selectedCategory;
    return this.isEnglish ? cat.nameEn : cat.name;
  }

  get activeCategoryCount(): number {
    return new Set(this.plants.map(p => p.category).filter(Boolean)).size;
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
        this.loginError = this.t.wrongCredentials;
        this.loginLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getGeneralWhatsappLink(): string {
    const phone = this.client?.whatsapp_number || '19392360534';
    const msg = this.isEnglish
      ? 'Hello, I would like to ask about your plant inventory.'
      : 'Hola, me gustaría consultar sobre el inventario.';
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}