import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plant, Client } from './services/plant.service';

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
    .no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2rem; cursor:default; }
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
      font-size:0.78rem; color:#516052; margin:0 0 10px 0; line-height:1.45;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
      flex-grow:1;
    }
    .care-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
    .chip { background:#f4f8f1; border:1px solid #eef1ec; padding:4px 9px;
      border-radius:20px; font-size:0.7rem; color:#516052; display:flex; align-items:center; gap:4px; }
    .wa-btn {
      background:#14452F; color:white; padding:11px; border-radius:10px;
      text-align:center; font-weight:600; font-size:0.82rem;
      display:flex; justify-content:center; align-items:center;
      margin-top:auto; text-decoration:none; transition:background 0.2s;
      cursor:pointer; border:none; width:100%; flex-shrink:0;
    }
    .wa-btn:hover { background:#0d3320; }
    .wa-disabled { background:#e5e7e5; color:#999; cursor:not-allowed; }
    .lightbox-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .lightbox-img {
      max-width:90vw; max-height:85vh; border-radius:16px; object-fit:contain;
      box-shadow:0 24px 80px rgba(0,0,0,0.5);
    }
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
      border:1px solid #eef1ec; transition:box-shadow 0.2s;
    }
    .admin-row:hover { box-shadow:0 4px 12px rgba(16,35,25,0.07); }
    .admin-thumb { width:52px; height:52px; border-radius:10px; overflow:hidden; background:#f4f8f1; flex-shrink:0; }
    .admin-thumb img { width:100%; height:100%; object-fit:cover; }
    .admin-badge { font-size:0.68rem; font-weight:700; padding:3px 8px; border-radius:8px; white-space:nowrap; }
    .btn-edit { background:#f4f8f1; border:1px solid #dfe7dd; color:#102319; border-radius:9px; padding:7px 13px; font-weight:600; cursor:pointer; font-size:0.8rem; white-space:nowrap; }
    .btn-delete { background:#fff0f0; border:1px solid #fad5d5; color:#9b1c1c; border-radius:9px; padding:7px 13px; font-weight:600; cursor:pointer; font-size:0.8rem; white-space:nowrap; }
  `],
  template: `
    <!-- PUBLIC CARD -->
    <ng-container *ngIf="!adminMode">
      <article class="plant-card">
        <div class="card-img-wrap" (click)="plant.image_url ? openLightbox() : null">
          <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name" loading="lazy">
          <div *ngIf="!plant.image_url" class="no-img">🪴</div>
          <span class="stock-badge"
            [class.badge-ok]="plant.stock > 5"
            [class.badge-low]="plant.stock > 0 && plant.stock <= 5"
            [class.badge-out]="plant.stock <= 0">
            {{ plant.stock > 0 ? plant.stock + ' en stock' : 'Agotada' }}
          </span>
        </div>

        <div class="card-body">
          <h3 class="plant-name">{{ plant.name }}</h3>

          <div class="plant-price" [class.no-price]="!plant.price">
            {{ plant.price ? '$' + plant.price : 'Consultar precio' }}
          </div>

          <p class="plant-desc">
            {{ plant.description || 'Consulta disponibilidad y detalles por WhatsApp.' }}
          </p>

          <div class="care-row">
            <span class="chip">☀️ {{ plant.light || 'Consultar luz' }}</span>
            <span class="chip">💧 {{ plant.water || 'Consultar riego' }}</span>
          </div>

          <a *ngIf="plant.stock > 0" class="wa-btn" [href]="getWhatsappLink()" target="_blank">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:7px;flex-shrink:0;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Consultar por WhatsApp
          </a>
          <button *ngIf="plant.stock <= 0" disabled class="wa-btn wa-disabled">No disponible</button>
        </div>
      </article>

      <!-- Lightbox -->
      <div *ngIf="lightboxOpen" class="lightbox-overlay" (click)="closeLightbox($event)">
        <button class="lightbox-close" (click)="lightboxOpen = false">✕</button>
        <img class="lightbox-img" [src]="plant.image_url" [alt]="plant.name">
      </div>
    </ng-container>

    <!-- ADMIN ROW -->
    <ng-container *ngIf="adminMode">
      <div class="admin-row">
        <div class="admin-thumb">
          <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name">
          <div *ngIf="!plant.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;">🪴</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#102319;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ plant.name }}</div>
          <div style="font-size:0.76rem;color:#516052;margin-top:2px;">{{ plant.category || '—' }} · {{ plant.price ? '$' + plant.price : 'Sin precio' }}</div>
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
export class PlantCardComponent {
  @Input({ required: true }) plant!: Plant;
  @Input() adminMode = false;
  @Input() client?: Client;
  @Output() onEdit = new EventEmitter<Plant>();
  @Output() onRemove = new EventEmitter<Plant>();

  lightboxOpen = false;

  openLightbox() { this.lightboxOpen = true; }

  closeLightbox(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lightbox-overlay')) {
      this.lightboxOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.lightboxOpen = false; }

  getWhatsappLink(): string {
    const number = this.client?.whatsapp_number || '19392360534';
    const message = `¡Hola! Me interesa la planta *${this.plant.name}* que vi en el catálogo.\n\n*Precio:* ${this.plant.price ? '$' + this.plant.price : 'por confirmar'}\n\n¿Podrían darme más información?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}