import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plant, Client } from './services/plant.service';

@Component({
  selector: 'app-plant-card',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .plant-card {
      background: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border: 1px solid #F0F2F0;
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .plant-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.06); }
    .card-image-container {
      width: 100%; height: 220px; background: #F4F8F1;
      display: flex; align-items: center; justify-content: center; position: relative;
    }
    .card-image-container img { width: 100%; height: 100%; object-fit: cover; }
    .stock-badge {
      position: absolute; top: 12px; right: 12px;
      background: #ecfff3; color: #17613d;
      font-weight: 700; padding: 6px 12px; border-radius: 12px; font-size: 0.8rem;
    }
    .stock-badge.low { background: #fff7ed; color: #c2410c; }
    .stock-badge.out { background: #fff0f0; color: #9b1c1c; }
    .card-content { padding: 20px; display: flex; flex-direction: column; flex: 1; }
    .plant-title { margin: 0 0 5px 0; font-size: 1.3rem; color: #102319; }
    .plant-price { font-size: 1.2rem; font-weight: 700; color: #2B7A3E; margin-bottom: 10px; }
    .plant-description { font-size: 0.9rem; color: #516052; margin: 0 0 15px 0; line-height: 1.4; }
    .care-badges { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .badge { background: #F0F2F0; padding: 6px 12px; border-radius: 12px; font-size: 0.8rem; color: #333; display: flex; align-items: center; gap: 5px; }
    .whatsapp-btn {
      background: #14452F; color: white; padding: 14px; border-radius: 12px;
      text-align: center; font-weight: 600; display: flex; justify-content: center;
      align-items: center; margin-top: auto; text-decoration: none;
      transition: background 0.2s; cursor: pointer; border: none; width: 100%;
    }
    .whatsapp-btn:hover { background: #0d3320; }
    .disabled-btn { background: #E0E0E0; color: #888; cursor: not-allowed; }
    /* Admin list style */
    .admin-row {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 16px; padding: 12px 16px;
      border: 1px solid #eef1ec; transition: box-shadow 0.2s;
    }
    .admin-row:hover { box-shadow: 0 4px 12px rgba(16,35,25,0.07); }
    .admin-thumb {
      width: 56px; height: 56px; border-radius: 12px;
      overflow: hidden; background: #f4f8f1; flex-shrink: 0;
    }
    .admin-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .admin-badge {
      font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 8px;
    }
    .btn-edit { background: #f4f8f1; border: 1px solid #dfe7dd; color: #102319; border-radius: 10px; padding: 8px 16px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
    .btn-delete { background: #fff0f0; border: 1px solid #fad5d5; color: #9b1c1c; border-radius: 10px; padding: 8px 16px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
  `],
  template: `
    <!-- PUBLIC CARD -->
    <ng-container *ngIf="!adminMode">
      <article class="plant-card">
        <div class="card-image-container">
          <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name">
          <div *ngIf="!plant.image_url" style="color:#2B7A3E;font-weight:600;">🪴 Sin imagen</div>
          <span class="stock-badge" [class.out]="plant.stock <= 0" [class.low]="plant.stock > 0 && plant.stock <= 5">
            {{ plant.stock > 0 ? plant.stock + ' en stock' : 'Agotada' }}
          </span>
        </div>
        <div class="card-content">
          <h3 class="plant-title">{{ plant.name }}</h3>
          <div class="plant-price">\${{ plant.price }}</div>
          <p class="plant-description">{{ plant.description || 'Planta muy resistente y fácil de cuidar.' }}</p>
          <div class="care-badges">
            <span class="badge">☀️ {{ plant.light || 'Luz indirecta' }}</span>
            <span class="badge">💧 {{ plant.water || 'Riego moderado' }}</span>
          </div>
          <a *ngIf="plant.stock > 0" class="whatsapp-btn" [href]="getWhatsappLink()" target="_blank">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:8px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Consultar por WhatsApp
          </a>
          <button *ngIf="plant.stock <= 0" disabled class="whatsapp-btn disabled-btn">No disponible</button>
        </div>
      </article>
    </ng-container>

    <!-- ADMIN ROW -->
    <ng-container *ngIf="adminMode">
      <div class="admin-row">
        <div class="admin-thumb">
          <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name">
          <div *ngIf="!plant.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🪴</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#102319;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ plant.name }}</div>
          <div style="font-size:0.8rem;color:#516052;margin-top:2px;">{{ plant.category }} · \${{ plant.price }}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;">
          <div style="font-weight:700;color:#102319;font-size:0.9rem;">{{ plant.stock }} u.</div>
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

  getWhatsappLink(): string {
    const number = this.client?.whatsapp_number || '19392360534';
    const message = `¡Hola! Me interesa la planta *${this.plant.name}* que vi en el catálogo.\n\n*Precio:* $${this.plant.price}\n\n¿Podrían darme más información?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}