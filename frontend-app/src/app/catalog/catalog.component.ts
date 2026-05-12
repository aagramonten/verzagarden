import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant } from '../services/plant.service';

declare const lucide: any;

const T = {
  es: {
    tagline: 'Plantas y Jardines',
    search: 'Buscar plantas y productos...',
    all: 'Todas',
    available: 'INVENTARIO DISPONIBLE',
    heroTitle: 'Demo Garden PR',
    heroSub: 'Explora plantas y productos disponibles y ordena directo por WhatsApp.',
    plants: 'Productos',
    categories: 'Categorías',
    available2: 'Disponibles',
    viewPlants: 'Ver productos',
    viewAll: 'Ver todas',
    loading: 'Cargando catálogo...',
    noPlants: 'No hay productos disponibles en esta categoría por el momento.',
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
    exploreTitle: 'Explora por categoría',
    exploreSub: 'Conoce los tipos de productos disponibles y encuentra más rápido la opción ideal para tu espacio.',
    order: 'Me interesa',
    inStock: 'en stock',
    outOfStock: 'Agotada',
  },
  en: {
    tagline: 'Plants & Gardens',
    search: 'Search plants and products...',
    all: 'All',
    available: 'AVAILABLE INVENTORY',
    heroTitle: 'Demo Garden PR',
    heroSub: 'Browse available plants and products and order directly via WhatsApp.',
    plants: 'Products',
    categories: 'Categories',
    available2: 'Available',
    viewPlants: 'View products',
    viewAll: 'View all',
    loading: 'Loading catalog...',
    noPlants: 'No products available in this category at the moment.',
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
    exploreTitle: 'Browse by category',
    exploreSub: 'Learn about the types of products available and find the perfect option for your space.',
    order: "I'm interested",
    inStock: 'in stock',
    outOfStock: 'Out of stock',
  }
};

const CATEGORIES_ES = [
  { name: 'Árboles',             nameEn: 'Trees',            icon: 'tree-pine',     desc: 'Plantas grandes con un tronco principal leñoso que se ramifica a cierta altura.', descEn: 'Large plants with a single woody trunk that branches at a certain height.', ideal: 'Sombra, estructura y jardines amplios.', idealEn: 'Shade, structure and large gardens.', group: 'plants' },
  { name: 'Arbustos',            nameEn: 'Shrubs',           icon: 'leaf',          desc: 'Plantas medianas con varios tallos leñosos que crecen desde la base.',             descEn: 'Medium-sized plants with multiple woody stems growing from the base.',       ideal: 'Bordes, divisiones naturales y jardines frondosos.', idealEn: 'Borders, natural dividers and lush gardens.', group: 'plants' },
  { name: 'Flores de estación',  nameEn: 'Seasonal Flowers', icon: 'flower-2',      desc: 'Plantas que florecen en épocas específicas del año y aportan color al jardín.',   descEn: 'Plants that bloom at specific times of year and add color to the garden.',  ideal: 'Renovar espacios según la temporada.', idealEn: 'Refreshing spaces according to the season.', group: 'plants' },
  { name: 'Plantas de interior', nameEn: 'Indoor Plants',    icon: 'home',          desc: 'Plantas que se adaptan bien a espacios interiores con luz y humedad controladas.', descEn: 'Plants that thrive indoors with controlled light and humidity.',              ideal: 'Hogares, oficinas y decoración interior.', idealEn: 'Homes, offices and interior décor.', group: 'plants' },
  { name: 'Trepadoras',          nameEn: 'Climbers',         icon: 'sprout',        desc: 'Plantas que necesitan soporte para crecer hacia arriba.',                         descEn: 'Plants that need support to grow upward.',                                   ideal: 'Cubrir paredes, crear sombra y añadir privacidad.', idealEn: 'Covering walls, creating shade and adding privacy.', group: 'plants' },
  { name: 'Suculentas',          nameEn: 'Succulents',       icon: 'sun',           desc: 'Plantas que almacenan agua en hojas, tallos o raíces, toleran mejor la sequía.',  descEn: 'Plants that store water in leaves, stems or roots, tolerating drought well.', ideal: 'Bajo mantenimiento y espacios soleados.', idealEn: 'Low maintenance and sunny spaces.', group: 'plants' },
  { name: 'Palmas',              nameEn: 'Palms',            icon: 'tree-palm',     desc: 'Plantas tropicales que aportan altura, elegancia y sensación caribeña.',          descEn: 'Tropical plants that add height, elegance and a Caribbean feel.',            ideal: 'Entradas, patios, terrazas y jardines tropicales.', idealEn: 'Entrances, patios, terraces and tropical gardens.', group: 'plants' },
  { name: 'Tiestos y Macetas',      nameEn: 'Pots & Planters',   icon: 'archive',       desc: 'Envases de barro, plástico, cerámica y materiales reciclados para todo tipo de plantas.', descEn: 'Clay, plastic, ceramic and recycled pots for all types of plants.',       ideal: 'Interior, exterior, balcones y terrazas.', idealEn: 'Indoors, outdoors, balconies and terraces.', group: 'products' },
  { name: 'Tierra y Sustratos',     nameEn: 'Soil & Substrates', icon: 'layers',        desc: 'Mezclas de suelo, turba, perlita y sustrato especializado para cada tipo de planta.',     descEn: 'Soil mixes, peat, perlite and specialized substrate for every plant type.', ideal: 'Siembra, trasplante y jardinería en general.', idealEn: 'Planting, transplanting and general gardening.', group: 'products' },
  { name: 'Fertilizantes y Abonos', nameEn: 'Fertilizers',       icon: 'flask-conical', desc: 'Abonos orgánicos, líquidos y granulados para estimular el crecimiento y la floración.',   descEn: 'Organic, liquid and granulated fertilizers to boost growth and blooming.',  ideal: 'Nutrición, crecimiento y floración de plantas.', idealEn: 'Plant nutrition, growth and blooming.', group: 'products' },
  { name: 'Herramientas',           nameEn: 'Tools',             icon: 'hammer',        desc: 'Palas, podadoras, guantes, regaderas y todo lo que necesitas para cuidar tu jardín.',    descEn: 'Shovels, pruners, gloves, watering cans and everything for your garden.',  ideal: 'Jardinería, poda, siembra y mantenimiento.', idealEn: 'Gardening, pruning, planting and maintenance.', group: 'products' },
];

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host {
      --bg: #F7F7F2;
      --surface: #FFFFFF;
      --hero: #EEF3EC;
      --primary: #9CAF96;
      --primary-hover: #8EA386;
      --primary-light: #DDE8DA;
      --text: #202820;
      --muted: #6F786E;
      --border: #E2E5DA;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .page { background: var(--bg); min-height: 100vh; color: var(--text); font-family: 'Helvetica Neue', Arial, sans-serif; }

    /* NAV */
    .nav { background: var(--bg); display: flex; justify-content: center; align-items: center; padding: 12px 20px; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
    .nav-center { display: flex; align-items: center; gap: 10px; }
    .nav-logo { width: 36px; height: 36px; border-radius: 10px; background: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .nav-logo img { width: 100%; height: 100%; object-fit: cover; }
    .nav-logo-fallback { color: white; display:flex; align-items:center; justify-content:center; }
    .nav-title { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.2; }
    .nav-sub { font-size: 10px; color: var(--muted); }
    .nav-admin { position: absolute; right: 20px; background: var(--primary); border: none; color: white; border-radius: 8px; padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer; display:flex; align-items:center; gap:4px; }

    /* HERO */
    .hero { background: var(--hero); padding: 28px 20px; border-bottom: 1px solid var(--border); }
    .hero-inner { display: flex; gap: 16px; align-items: flex-start; max-width: 1200px; margin: 0 auto; }
    .hero-left { flex: 1; }
    .hero-badge { display: inline-block; background: var(--primary); color: white; border-radius: 20px; padding: 3px 10px; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
    .hero-title { font-size: 22px; font-weight: 700; color: var(--text); line-height: 1.2; margin-bottom: 8px; }
    .hero-title span { color: var(--primary); }
    .hero-sub { font-size: 12px; color: var(--muted); line-height: 1.6; margin-bottom: 18px; }
    .hero-btns { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-primary { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 9px 16px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .btn-secondary { background: white; color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 9px 16px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; text-decoration: none; }
    .hero-stats { display: flex; gap: 20px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
    .stat-n { font-size: 20px; font-weight: 700; color: var(--text); }
    .stat-l { font-size: 10px; color: var(--muted); margin-top: 2px; }
    .hero-right { width: 140px; flex-shrink: 0; }
    .featured-card { background: var(--surface); border-radius: 16px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .featured-img { background: linear-gradient(160deg, var(--primary), var(--primary-hover)); height: 90px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .featured-img img { width: 100%; height: 100%; object-fit: cover; }
    .featured-img-fallback { color: white; opacity: 0.7; }
    .featured-body { padding: 10px; }
    .featured-name { font-size: 10px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
    .featured-price { font-size: 14px; font-weight: 700; color: var(--text); }
    .featured-stock { font-size: 9px; color: var(--primary); margin-top: 2px; }
    .featured-btn { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 7px; font-size: 10px; font-weight: 600; width: 100%; margin-top: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; }

    /* SEARCH */
    .search-wrap { background: var(--surface); padding: 12px 20px; border-bottom: 1px solid var(--border); }
    .search-box { background: var(--bg); border: 1px solid var(--border); border-radius: 24px; padding: 9px 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .search-box input { flex: 1; border: none; background: transparent; font-size: 13px; color: var(--text); outline: none; }
    .search-box input::placeholder { color: var(--muted); }
    .pills { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
    .pills::-webkit-scrollbar { display: none; }
    .pill { background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 20px; padding: 5px 12px; font-size: 10px; font-weight: 500; cursor: pointer; white-space: nowrap; flex-shrink: 0; display:flex; align-items:center; gap:5px; }
    .pill.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pill-sep { font-size: 10px; color: var(--muted); font-weight: 600; padding: 0 4px; white-space: nowrap; display: flex; align-items: center; flex-shrink: 0; }

    /* SECTIONS */
    .section { padding: 24px 20px 0; max-width: 1200px; margin: 0 auto; }
    .sec-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .sec-title { font-size: 15px; font-weight: 700; color: var(--text); display:flex; align-items:center; gap:6px; }
    .sec-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .sec-link { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 5px 12px; font-size: 10px; font-weight: 600; cursor: pointer; }
    .group-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--primary); display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }

    /* CAT GRID */
    .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    @media (max-width: 600px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
    .cat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 10px; cursor: pointer; transition: all 0.15s; text-align: left; }
    .cat-card:hover { border-color: var(--primary); background: var(--hero); }
    .cat-card.active { background: var(--primary); border-color: var(--primary); }
    .cat-emoji { margin-bottom: 8px; display: block; color: var(--primary); }
    .cat-card.active .cat-emoji { color: white; }
    .cat-name { font-size: 11px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
    .cat-card.active .cat-name { color: white; }
    .cat-desc { font-size: 9px; color: var(--muted); line-height: 1.4; margin-bottom: 4px; }
    .cat-card.active .cat-desc { color: rgba(255,255,255,0.8); }
    .cat-ideal { font-size: 9px; color: var(--primary); font-weight: 600; }
    .cat-card.active .cat-ideal { color: rgba(255,255,255,0.9); }
    .cat-btn { margin-top: 8px; background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 4px 10px; font-size: 9px; font-weight: 600; cursor: pointer; }
    .cat-card.active .cat-btn { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); color: white; }

    /* PLANT GRID */
    .plant-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding-bottom: 24px; }
    @media (min-width: 768px) { .plant-grid { grid-template-columns: repeat(3, 1fr); } }
    .pcard { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .pcard-img { background: linear-gradient(160deg, var(--primary), var(--primary-hover)); height: 120px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    .pcard-img img { width: 100%; height: 100%; object-fit: cover; }
    .pcard-img-fallback { color: white; opacity: 0.5; }
    .stock-badge { position: absolute; top: 8px; right: 8px; border-radius: 8px; padding: 3px 7px; font-size: 9px; font-weight: 600; }
    .stock-badge.ok { background: var(--primary); color: white; }
    .stock-badge.low { background: #c87830; color: white; }
    .stock-badge.out { background: #888; color: white; }
    .pcard-body { padding: 12px; }
    .pcard-name { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
    .pcard-desc { font-size: 10px; color: var(--muted); margin-bottom: 10px; line-height: 1.4; }
    .pcard-foot { display: flex; justify-content: space-between; align-items: center; }
    .pcard-price { font-size: 16px; font-weight: 700; color: var(--text); }
    .pcard-btn { background: var(--primary); color: white; border: none; border-radius: 9px; padding: 7px 12px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; }
    .pcard-btn.out { background: var(--border); color: var(--muted); cursor: default; }

    /* EMPTY */
    .empty { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px 24px; text-align: center; margin-bottom: 24px; }
    .empty-icon { color: var(--primary); display:flex; justify-content:center; margin-bottom: 12px; }
    .empty-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
    .empty-sub { font-size: 12px; color: var(--muted); margin-bottom: 16px; }
    .empty-btn { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 10px 20px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }

    /* FOOTER */
    .footer { background: var(--hero); border-top: 1px solid var(--border); padding: 24px 20px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; }
    .footer-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .footer-logo { width: 36px; height: 36px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .footer-logo img { width: 100%; height: 100%; object-fit: cover; }
    .footer-biz { font-size: 13px; font-weight: 600; color: var(--text); }
    .footer-tag { font-size: 10px; color: var(--muted); margin-top: 1px; }
    .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .f-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); }
    .footer-wa { background: var(--primary); color: white; border: none; border-radius: 12px; padding: 12px; width: 100%; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 14px; }
    .footer-copy { font-size: 10px; color: var(--muted); text-align: center; }

    /* MODAL */
    .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: white; border-radius: 20px; padding: 28px; width: 100%; max-width: 380px; }
    .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-title { font-size: 18px; font-weight: 700; color: var(--text); }
    .modal-close { background: var(--bg); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 14px; color: var(--muted); }
    .modal-fields { display: flex; flex-direction: column; gap: 12px; }
    .modal-input { padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border); font-size: 14px; outline: none; width: 100%; color: var(--text); background: var(--bg); }
    .modal-error { font-size: 12px; color: #c5221f; font-weight: 500; }
    .modal-btn { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; }
    .loading-state { display:flex; align-items:center; justify-content:center; gap:8px; padding: 40px; color: var(--muted); font-size: 14px; }
    
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `],
  template: `
  <div class="page">

    <header class="nav">
      <div class="nav-center">
        <div class="nav-logo">
          <img *ngIf="client?.logo_url" [src]="client!.logo_url" alt="logo">
          <span *ngIf="!client?.logo_url" class="nav-logo-fallback"><i data-lucide="leaf" style="width:20px;height:20px;"></i></span>
        </div>
        <div>
          <div class="nav-title">{{ client?.business_name || t.heroTitle }}</div>
          <div class="nav-sub">{{ t.tagline }}</div>
        </div>
      </div>
      <button class="nav-admin" (click)="goToAdmin()">
        <i data-lucide="settings" style="width:12px;height:12px;"></i>{{ t.admin }}
      </button>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <div class="hero-left">
          <div class="hero-badge">{{ t.available }}</div>
          <h1 class="hero-title">Plantas que <span>transforman</span> tu espacio</h1>
          <p class="hero-sub">{{ t.heroSub }}</p>
          <div class="hero-btns">
            <button class="btn-primary" (click)="scrollToCatalog()"><i data-lucide="leaf" style="width:14px;height:14px;"></i> {{ t.viewPlants }}</button>
            <a class="btn-secondary" [href]="getGeneralWhatsappLink()" target="_blank"><i data-lucide="message-circle" style="width:14px;height:14px;color:#9CAF96;"></i> WhatsApp</a>
          </div>
          <div class="hero-stats">
            <div><div class="stat-n">{{ plants.length }}</div><div class="stat-l">{{ t.plants }}</div></div>
            <div><div class="stat-n">{{ activeCategoryCount }}</div><div class="stat-l">{{ t.categories }}</div></div>
            <div><div class="stat-n">{{ availablePlants }}</div><div class="stat-l">{{ t.available2 }}</div></div>
          </div>
        </div>
        <div class="hero-right" *ngIf="featuredPlant">
          <div class="featured-card">
            <div class="featured-img">
              <img *ngIf="featuredPlant.image_url" [src]="featuredPlant.image_url" [alt]="featuredPlant.name">
              <span *ngIf="!featuredPlant.image_url" class="featured-img-fallback"><i data-lucide="sprout" style="width:36px;height:36px;"></i></span>
            </div>
            <div class="featured-body">
              <div class="featured-name">{{ featuredPlant.name }}</div>
              <div class="featured-price">\${{ featuredPlant.price.toFixed(2) }}</div>
              <div class="featured-stock">{{ featuredPlant.stock }} {{ t.inStock }}</div>
              <button class="featured-btn" (click)="orderPlant(featuredPlant)"><i data-lucide="message-circle" style="width:12px;height:12px;"></i> {{ t.order }}</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="search-wrap">
      <div class="search-box">
        <i data-lucide="search" style="width:16px;height:16px;color:#6F786E;"></i>
        <input type="text" [(ngModel)]="search" [placeholder]="t.search">
        <a [href]="getGeneralWhatsappLink()" target="_blank" style="color:#9CAF96;display:flex;align-items:center;">
          <i data-lucide="message-circle" style="width:18px;height:18px;"></i>
        </a>
      </div>
      <div class="pills">
        <button class="pill" [class.active]="selectedCategory === 'Todas'" (click)="setCategory('Todas')">{{ t.all }}</button>
        <span class="pill-sep">— Plantas</span>
        <button *ngFor="let cat of PLANT_CATS" class="pill" [class.active]="selectedCategory === cat.name" (click)="setCategory(cat.name)">
          <i [attr.data-lucide]="cat.icon" style="width:12px;height:12px;"></i> {{ getFilterLabel(cat) }}
        </button>
        <span class="pill-sep">— Productos</span>
        <button *ngFor="let cat of PRODUCT_CATS" class="pill" [class.active]="selectedCategory === cat.name" (click)="setCategory(cat.name)">
          <i [attr.data-lucide]="cat.icon" style="width:12px;height:12px;"></i> {{ getFilterLabel(cat) }}
        </button>
      </div>
    </div>

    <div class="section">
      <div class="sec-head">
        <div>
          <div class="sec-title">{{ t.exploreTitle }}</div>
          <div class="sec-sub">{{ t.exploreSub }}</div>
        </div>
      </div>
      <div class="group-label"><i data-lucide="leaf" style="width:12px;height:12px;"></i> Plantas</div>
      <div class="cat-grid">
        <div *ngFor="let cat of PLANT_CATS" class="cat-card" [class.active]="selectedCategory === cat.name" (click)="setCategory(cat.name)">
          <span class="cat-emoji"><i [attr.data-lucide]="cat.icon" style="width:22px;height:22px;"></i></span>
          <div class="cat-name">{{ isEnglish ? cat.nameEn : cat.name }}</div>
          <div class="cat-desc">{{ isEnglish ? cat.descEn : cat.desc }}</div>
          <div class="cat-ideal">{{ t.catIdeal }} {{ isEnglish ? cat.idealEn : cat.ideal }}</div>
          <button class="cat-btn" (click)="$event.stopPropagation(); setCategory(cat.name)">{{ t.viewPlants }}</button>
        </div>
      </div>
      <div class="group-label" style="color:#c87830;"><i data-lucide="shopping-bag" style="width:12px;height:12px;"></i> Productos de jardín</div>
      <div class="cat-grid" style="margin-bottom:24px;">
        <div *ngFor="let cat of PRODUCT_CATS" class="cat-card" [class.active]="selectedCategory === cat.name" (click)="setCategory(cat.name)">
          <span class="cat-emoji"><i [attr.data-lucide]="cat.icon" style="width:22px;height:22px;"></i></span>
          <div class="cat-name">{{ isEnglish ? cat.nameEn : cat.name }}</div>
          <div class="cat-desc">{{ isEnglish ? cat.descEn : cat.desc }}</div>
          <div class="cat-ideal" style="color:#c87830;">{{ t.catIdeal }} {{ isEnglish ? cat.idealEn : cat.ideal }}</div>
          <button class="cat-btn" (click)="$event.stopPropagation(); setCategory(cat.name)">{{ t.viewPlants }}</button>
        </div>
      </div>
    </div>

    <div class="section" id="catalogo">
      <div class="sec-head">
        <div>
          <div class="sec-title">
            <span *ngIf="selectedCategory !== 'Todas'" style="display:flex;align-items:center;gap:6px;">
              <i [attr.data-lucide]="getCatIcon(selectedCategory)" style="width:16px;height:16px;"></i> {{ getActiveCatName() }}
            </span>
            <span *ngIf="selectedCategory === 'Todas'">Plantas disponibles</span>
          </div>
          <div class="sec-sub">{{ filteredPlants.length }} {{ t.plants.toLowerCase() }} disponibles</div>
        </div>
        <button *ngIf="selectedCategory !== 'Todas'" class="sec-link" (click)="setCategory('Todas')">{{ t.viewAll }} ✕</button>
      </div>
      <div *ngIf="loading" class="loading-state">
        <i data-lucide="loader-2" class="spin" style="width:20px;height:20px;"></i> {{ t.loading }}
      </div>
      <div *ngIf="!loading && filteredPlants.length > 0" class="plant-grid">
        <div *ngFor="let p of filteredPlants" class="pcard">
          <div class="pcard-img">
            <img *ngIf="p.image_url" [src]="p.image_url" [alt]="p.name">
            <span *ngIf="!p.image_url" class="pcard-img-fallback"><i data-lucide="sprout" style="width:40px;height:40px;"></i></span>
            <div class="stock-badge" [class.ok]="p.stock > 5" [class.low]="p.stock > 0 && p.stock <= 5" [class.out]="p.stock === 0">
              <span *ngIf="p.stock > 0">{{ p.stock }} {{ t.inStock }}</span>
              <span *ngIf="p.stock === 0">{{ t.outOfStock }}</span>
            </div>
          </div>
          <div class="pcard-body">
            <div class="pcard-name">{{ p.name }}</div>
            <div class="pcard-desc">
              <span *ngIf="p.light">{{ p.light }}</span><span *ngIf="p.light && p.water"> · </span><span *ngIf="p.water">{{ p.water }}</span>
              <span *ngIf="!p.light && !p.water">{{ p.description }}</span>
            </div>
            <div class="pcard-foot">
              <div class="pcard-price">\${{ p.price.toFixed(2) }}</div>
              <button class="pcard-btn" [class.out]="p.stock === 0" (click)="orderPlant(p)" [disabled]="p.stock === 0">
                <i data-lucide="message-circle" style="width:12px;height:12px;"></i> {{ p.stock === 0 ? t.outOfStock : t.order }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="!loading && filteredPlants.length === 0" class="empty">
        <div class="empty-icon"><i data-lucide="sprout" style="width:40px;height:40px;"></i></div>
        <div class="empty-title">{{ t.noPlants }}</div>
        <p class="empty-sub">{{ t.noPlantsSub }}</p>
        <a class="empty-btn" [href]="getGeneralWhatsappLink()" target="_blank"><i data-lucide="message-circle" style="width:14px;height:14px;"></i> {{ t.consultWA }}</a>
      </div>
    </div>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-logo">
            <img *ngIf="client?.logo_url" [src]="client!.logo_url" alt="logo">
            <span *ngIf="!client?.logo_url" style="color:white;display:flex;align-items:center;justify-content:center;">
              <i data-lucide="leaf" style="width:20px;height:20px;"></i>
            </span>
          </div>
          <div>
            <div class="footer-biz">{{ client?.business_name || t.heroTitle }}</div>
            <div class="footer-tag">{{ t.tagline }}</div>
          </div>
        </div>
        <div class="footer-grid">
          <div class="f-item"><i data-lucide="map-pin" style="width:14px;height:14px;color:#9CAF96;"></i> <span>Puerto Rico</span></div>
          <div class="f-item"><i data-lucide="clock" style="width:14px;height:14px;color:#9CAF96;"></i> <span>Lun–Sáb 8am–5pm</span></div>
          <div class="f-item"><i data-lucide="smartphone" style="width:14px;height:14px;color:#9CAF96;"></i> <span>{{ client?.whatsapp_number || '' }}</span></div>
          <div class="f-item"><i data-lucide="message-circle" style="width:14px;height:14px;color:#9CAF96;"></i> <span>Consultas por WhatsApp</span></div>
        </div>
        <button class="footer-wa" (click)="openWhatsapp()"><i data-lucide="message-circle" style="width:14px;height:14px;"></i> {{ t.consultWA }}</button>
        <div class="footer-copy">© 2026 {{ client?.business_name || t.heroTitle }} · Verzagarden</div>
      </div>
    </footer>

  </div>

  <div class="modal-bg" *ngIf="showLoginModal" (click)="showLoginModal = false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-head">
        <div class="modal-title">{{ t.adminAccess }}</div>
        <button class="modal-close" (click)="showLoginModal = false">✕</button>
      </div>
      <div class="modal-fields">
        <input class="modal-input" type="text" [placeholder]="t.username" [(ngModel)]="loginUsername">
        <input class="modal-input" type="password" [placeholder]="t.password" [(ngModel)]="loginPassword" (keyup.enter)="submitLogin()">
        <div class="modal-error" *ngIf="loginError">{{ t.wrongCredentials }}</div>
        <button class="modal-btn" (click)="submitLogin()" [disabled]="loginLoading">{{ loginLoading ? t.verifying : t.enter }}</button>
      </div>
    </div>
  </div>
  `
})
export class CatalogComponent implements OnInit, AfterViewInit {
  readonly CATEGORIES = CATEGORIES_ES;
  readonly PLANT_CATS = CATEGORIES_ES.filter(c => c.group === 'plants');
  readonly PRODUCT_CATS = CATEGORIES_ES.filter(c => c.group === 'products');

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

  get featuredPlant(): Plant | undefined {
    return this.plants.find(p => p.is_featured && p.stock > 0) || this.plants.find(p => p.stock > 0);
  }

  get availablePlants(): number { return this.plants.filter(p => p.stock > 0).length; }

  get activeCategoryCount(): number {
    return new Set(this.plants.map(p => p.category).filter(Boolean)).size;
  }

  get filteredPlants(): Plant[] {
    const term = this.search.toLowerCase().trim();
    return this.plants.filter(p => {
      const matchSearch = !term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
      const matchCat = this.selectedCategory === 'Todas' || p.category === this.selectedCategory;
      return matchSearch && matchCat;
    });
  }

  constructor(private plantService: PlantService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.clientSlug = this.plantService.getSlug();
    if (window.location.search.includes('login=true')) {
      this.showLoginModal = true;
      window.history.replaceState({}, '', '/');
    }
    this.loadData();
  }

  ngAfterViewInit() {
    this.renderIcons();
  }

  renderIcons() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }

  loadData() {
    this.plantService.getPlants(this.clientSlug).subscribe({
      next: plants => { this.plants = [...plants]; this.loading = false; this.cdr.detectChanges(); this.renderIcons(); },
      error: () => { this.loading = false; }
    });
    this.plantService.getClient(this.clientSlug).subscribe({
      next: client => { this.client = { ...client }; this.cdr.detectChanges(); },
      error: err => console.error(err)
    });
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
    setTimeout(() => {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.renderIcons();
    }, 50);
  }

  scrollToCatalog() {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getFilterLabel(cat: typeof CATEGORIES_ES[0]): string {
    if (this.isEnglish) {
      if (cat.nameEn === 'Seasonal Flowers') return 'Flowers';
      if (cat.nameEn === 'Indoor Plants') return 'Indoor';
      if (cat.nameEn === 'Pots & Planters') return 'Pots';
      if (cat.nameEn === 'Soil & Substrates') return 'Soil';
      return cat.nameEn;
    }
    if (cat.name === 'Plantas de interior') return 'Interior';
    if (cat.name === 'Flores de estación') return 'Flores';
    if (cat.name === 'Tiestos y Macetas') return 'Tiestos';
    if (cat.name === 'Tierra y Sustratos') return 'Tierra';
    if (cat.name === 'Fertilizantes y Abonos') return 'Fertilizantes';
    return cat.name;
  }

  getCatIcon(name: string): string {
    return CATEGORIES_ES.find(c => c.name === name)?.icon || 'leaf';
  }

  getActiveCatName(): string {
    const cat = CATEGORIES_ES.find(c => c.name === this.selectedCategory);
    if (!cat) return this.selectedCategory;
    return this.isEnglish ? cat.nameEn : cat.name;
  }

  orderPlant(plant: Plant) {
    const phone = this.client?.whatsapp_number || '19392360534';
    
    // Fallback de idioma si no hay custom template
    const defaultMsg = this.isEnglish
      ? "Hello! I'm interested in {planta} at {precio}. Is it available?"
      : "Hola! Me interesa {planta} a {precio}. ¿Está disponible?";
      
    // Leemos el settings del backend
    let template = (this.client as any)?.whatsapp_message || defaultMsg;
    
    // Reemplazamos tags dinámicos
    const priceStr = plant.price ? '$' + plant.price.toFixed(2) : (this.isEnglish ? 'TBD' : 'por confirmar');
    const catStr = plant.category || '';
    
    const msg = template
      .replace(/{planta}/g, plant.name)
      .replace(/{precio}/g, priceStr)
      .replace(/{categoria}/g, catStr);

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  openWhatsapp() { window.open(this.getGeneralWhatsappLink(), '_blank'); }

  getGeneralWhatsappLink(): string {
    const phone = this.client?.whatsapp_number || '19392360534';
    const msg = this.isEnglish
      ? 'Hello, I would like to ask about your inventory.'
      : 'Hola, me gustaría consultar sobre el inventario.';
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
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
}