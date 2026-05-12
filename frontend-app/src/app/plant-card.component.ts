import { Component, Input, Output, EventEmitter, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plant, Client } from './services/plant.service';

declare const lucide: any;

@Component({
  selector: 'app-plant-card',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .plant-card {
      background: #FFFFFF; border-radius: 18px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #eef1ec;
      display: flex; flex-direction: column; height: 100%;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .plant-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(16,35,25,0.09); }
    .card-img-wrap {
      width: 100%; height: 170px; background: #f4f8f1;
      position: relative; overflow: hidden; cursor: zoom-in; flex-shrink: 0;
    }
    .card-img-wrap img { width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease; display:block; }
    .plant-card:hover .card-img-wrap img { transform: scale(1.04); }
    .no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#9CAF96; cursor:default; }
    .stock-badge {
      position:absolute; bottom:10px; right:10px;
      font-weight:700; padding:4px 10px; border-radius:10px; font-size:0.72rem;
      backdrop-filter: blur(4px);
    }
    .badge-ok  { background:rgba(236,255,243,0.92); color:#17613d; }
    .badge-low { background:rgba(255,247,237,0.92); color:#c2410c; }
    .badge-out { background:rgba(255,240,240,0.92); color:#9b1c1c; }
    .card-body { padding:14px 16px 16px; display:flex; flex-direction:column; flex:1; }
    .plant-name { margin:0 0 3px 0; font-size:1rem; font-weight:700; color:#102319; line-height:1.25; }
    .plant-price { font-size:0.95rem; font-weight:700; color:#1f7a4d; margin-bottom:7px; }
    .plant-price.no-price { color:#516052; font-weight:500; font-size:0.85rem; }
    .plant-desc {
      font-size:0.78rem; color:#516052; margin:0 0 10px 0; line-height:1.45; flex-grow:1;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    }
    .care-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
    .chip { background:#f4f8f1; border:1px solid #eef1ec; padding:4px 9px;
      border-radius:20px; font-size:0.7rem; color:#516052; display:flex; align-items:center; gap:6px; }
    .wa-btn {
      background:#14452F; color:white; padding:11px; border-radius:10px;
      text-align:center; font-weight:600; font-size:0.82rem;
      display:flex; justify-content:center; align-items:center; gap: 6px;
      margin-top:auto; text-decoration:none; transition:background 0.2s;
      cursor:pointer; border:none; width:100%; flex-shrink:0;
    }
    .wa-btn:hover { background:#0d3320; }
    .lightbox-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .lightbox-img { max-width:90vw; max-height:85vh; border-radius:16px; object-fit:contain; box-shadow:0 24px 80px rgba(0,0,0,0.5); }
    .lightbox-close {
      position:fixed; top:18px; right:18px;
      background:rgba(255,255,255,0.15); border:none; color:white;
      width:42px; height:42px; border-radius:99px; font-size:1.1rem;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:background 0.2s; z-index:10000;
    }
    .lightbox-close:hover { background:rgba(255,255,255,0.28); }
    .admin-row {
      display:flex; align-items:center; gap:12px;
      background:white; border-radius:14px; padding:12px 14px;
      border:1px solid #eef1ec; transition:box-shadow 0.2s; flex-wrap:wrap;
    }
    .admin-row:hover { box-shadow:0 4px 12px rgba(16,35,25,0.07); }
    .admin-thumb { width:52px; height:52px; border-radius:10px; overflow:hidden; background:#f4f8f1; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .admin-thumb img { width:100%; height:100%; object-fit:cover; }
    .admin-badge { font-size:0.68rem; font-weight:700; padding:3px 8px; border-radius:8px; white-space:nowrap; }
    .btn-edit { background:#f4f8f1; border:1px solid #dfe7dd; color:#102319; border-radius:9px; padding:7px 13px; font-weight:600; cursor:pointer; font-size:0.8rem; white-space:nowrap; }
    .btn-delete { background:#fff0f0; border:1px solid #fad5d5; color:#9b1c1c; border-radius:9px; padding:7px 13px; font-weight:600; cursor:pointer; font-size:0.8rem; white-space:nowrap; }
    .price-col { display:flex; flex-direction:column; gap:3px; align-items:flex-end; flex-shrink:0; }
    .price-row { display:flex; align-items:center; gap:5px; }
    .price-label { font-size:0.65rem; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; }
    .price-value { font-size:0.88rem; font-weight:700; }
    .margin-badge { font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:6px; margin-top:2px; }
  `],
  template: `
    <ng-container *ngIf="!adminMode">
      <article class="plant-card">
        <div class="card-img-wrap" (click)="plant.image_url ? openLightbox() : null">
          <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name" loading="lazy">
          <div *ngIf="!plant.image_url" class="no-img"><i data-lucide="sprout" style="width:40px;height:40px;"></i></div>
          <span class="stock-badge"
            [class.badge-ok]="plant.stock > 5"
            [class.badge-low]="plant.stock > 0 && plant.stock <= 5"
            [class.badge-out]="plant.stock <= 0">
            {{ plant.stock > 0 ? plant.stock + (isEnglish ? ' in stock' : ' en stock') : (isEnglish ? 'Out of stock' : 'Agotada') }}
          </span>
        </div>
        <div class="card-body">
          <h3 class="plant-name">{{ plant.name }}</h3>
          <div class="plant-price" [class.no-price]="!plant.price">
            {{ plant.price ? '$' + toNum(plant.price).toFixed(2) : (isEnglish ? 'Ask for price' : 'Consultar precio') }}
          </div>
          <p class="plant-desc">{{ plant.description || (isEnglish ? 'Ask about availability and details via WhatsApp.' : 'Consulta disponibilidad y detalles por WhatsApp.') }}</p>
          <div class="care-row">
            <span class="chip"><i data-lucide="sun" style="width:12px;height:12px;"></i> {{ plant.light || (isEnglish ? 'Ask about light' : 'Consultar luz') }}</span>
            <span class="chip"><i data-lucide="droplet" style="width:12px;height:12px;"></i> {{ plant.water || (isEnglish ? 'Ask about watering' : 'Consultar riego') }}</span>
          </div>
          <a *ngIf="plant.stock > 0" class="wa-btn" [href]="getWhatsappLink()" target="_blank">
            <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
            {{ isEnglish ? "I'm interested" : 'Me interesa' }}
          </a>
          <a *ngIf="plant.stock <= 0" class="wa-btn" [href]="getWhatsappLink()" target="_blank" style="opacity:0.75;">
            <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
            {{ isEnglish ? 'Check availability' : 'Consultar disponibilidad' }}
          </a>
        </div>
      </article>

      <div *ngIf="lightboxOpen" class="lightbox-overlay" (click)="closeLightbox($event)">
        <button class="lightbox-close" (click)="lightboxOpen = false">✕</button>
        <img class="lightbox-img" [src]="plant.image_url" [alt]="plant.name">
      </div>
    </ng-container>

    <ng-container *ngIf="adminMode">
      <div class="admin-row">
        <div class="admin-thumb">
          <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name">
          <i *ngIf="!plant.image_url" data-lucide="sprout" style="width:24px;height:24px;color:#9ca3af;"></i>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#102319;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ plant.name }}</div>
          <div style="font-size:0.75rem;color:#516052;margin-top:2px;">{{ plant.category || '—' }}</div>
        </div>
        <div class="price-col">
          <div class="price-row">
            <span class="price-label">Venta</span>
            <span class="price-value" style="color:#1f7a4d;">{{ plant.price ? '$' + toNum(plant.price).toFixed(2) : '—' }}</span>
          </div>
          <div class="price-row" *ngIf="plant.cost_price">
            <span class="price-label">Costo</span>
            <span class="price-value" style="color:#516052;">\${{ toNum(plant.cost_price!).toFixed(2) }}</span>
          </div>
          <div *ngIf="plant.price && plant.cost_price" class="margin-badge"
            [style.background]="getMarginBg()"
            [style.color]="getMarginColor()">
            {{ getMarginPct() | number:'1.0-1' }}% margen
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
          <div style="font-weight:700;color:#102319;font-size:0.85rem;">{{ plant.stock }} u.</div>
          <span *ngIf="plant.stock === 0" class="admin-badge" style="background:#fff0f0;color:#9b1c1c;">Sin stock</span>
          <span *ngIf="plant.stock > 0 && plant.stock <= 5" class="admin-badge" style="background:#fff7ed;color:#c2410c;">Bajo stock</span>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn-edit" (click)="onEdit.emit(plant)">Editar</button>
          <button class="btn-delete" (click)="onRemove.emit(plant)">Borrar</button>
        </div>
      </div>
    </ng-container>
  `
})
export class PlantCardComponent implements AfterViewInit {
  @Input({ required: true }) plant!: Plant;
  @Input() adminMode = false;
  @Input() isEnglish = false;
  @Input() client?: Client;
  @Output() onEdit = new EventEmitter<Plant>();
  @Output() onRemove = new EventEmitter<Plant>();

  lightboxOpen = false;

  ngAfterViewInit() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }

  /** Convierte cualquier valor a número de forma segura */
  toNum(val: any): number {
    return Number(val) || 0;
  }

  openLightbox() { this.lightboxOpen = true; }

  closeLightbox(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lightbox-overlay')) {
      this.lightboxOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.lightboxOpen = false; }

  getMarginPct(): number {
    const price = this.toNum(this.plant.price);
    const cost = this.toNum(this.plant.cost_price);
    if (!price || !cost) return 0;
    return ((price - cost) / price) * 100;
  }

  getMarginBg(): string {
    const m = this.getMarginPct();
    if (m >= 40) return '#dcfce7';
    if (m >= 20) return '#fef3c7';
    return '#fee2e2';
  }

  getMarginColor(): string {
    const m = this.getMarginPct();
    if (m >= 40) return '#15803d';
    if (m >= 20) return '#92400e';
    return '#991b1b';
  }

  getWhatsappLink(): string {
    const number = this.client?.whatsapp_number || '19392360534';

    const defaultMsg = this.isEnglish
      ? "Hello! I'm interested in {planta} at {precio}. Is it available?"
      : "Hola! Me interesa {planta} a {precio}. ¿Está disponible?";

    let template = (this.client as any)?.whatsapp_message || defaultMsg;

    const price = this.toNum(this.plant.price);
    const priceStr = price
      ? '$' + price.toFixed(2)
      : (this.isEnglish ? 'TBD' : 'por confirmar');

    const catStr = this.plant.category || '';

    const message = template
      .replace(/{planta}/g, this.plant.name)
      .replace(/{precio}/g, priceStr)
      .replace(/{categoria}/g, catStr);

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}