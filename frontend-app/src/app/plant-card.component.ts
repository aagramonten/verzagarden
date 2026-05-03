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
    .plant-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0,0,0,0.06);
    }
    .card-image-container {
      width: 100%;
      height: 220px;
      background: #F4F8F1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .card-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .no-image {
      color: #2B7A3E;
      font-weight: 600;
    }
    .stock-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #ecfff3;
      color: #17613d;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stock-badge.out {
      background: #fff0f0;
      color: #9b1c1c;
    }
    .card-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .plant-title {
      margin: 0 0 5px 0;
      font-size: 1.3rem;
      color: #102319;
    }
    .plant-price {
      font-size: 1.2rem;
      font-weight: 700;
      color: #2B7A3E;
      margin-bottom: 10px;
    }
    .plant-description {
      font-size: 0.9rem;
      color: #516052;
      margin: 0 0 15px 0;
      line-height: 1.4;
    }
    .care-badges {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .badge {
      background: #F0F2F0;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      color: #333;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .whatsapp-card-btn {
      background: #2B7A3E;
      color: white;
      padding: 14px;
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: auto;
      text-decoration: none;
      transition: background 0.2s;
      cursor: pointer;
      border: none;
      width: 100%;
    }
    .whatsapp-card-btn:hover {
      background: #226131;
    }
    .disabled-btn {
      background: #E0E0E0;
      color: #888;
      cursor: not-allowed;
    }
    .admin-card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }
    .btn-edit, .btn-delete {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid;
      background: white;
    }
    .btn-edit {
      background: #f4f8f1; border-color: #dfe7dd; color: #102319;
    }
    .btn-delete {
      background: #fff0f0; border-color: #fad5d5; color: #9b1c1c;
    }
  `],
  template: `
    <article class="plant-card">
      <div class="card-image-container">
        <img *ngIf="plant.image_url" [src]="plant.image_url" [alt]="plant.name">
        <div *ngIf="!plant.image_url" class="no-image">🪴 Sin imagen</div>
        <span class="stock-badge" [class.out]="plant.stock <= 0">
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

        <ng-container *ngIf="!adminMode">
          <a *ngIf="plant.stock > 0" class="whatsapp-card-btn" [href]="getWhatsappLink()" target="_blank">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 8px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Ordenar por WhatsApp
          </a>
          <button *ngIf="plant.stock <= 0" disabled class="whatsapp-card-btn disabled-btn">
            No disponible
          </button>
        </ng-container>

        <div class="admin-card-actions" *ngIf="adminMode">
          <button class="btn-edit" (click)="onEdit.emit(plant)">Editar</button>
          <button class="btn-delete" (click)="onRemove.emit(plant)">Borrar</button>
        </div>
      </div>
    </article>
  `
})
export class PlantCardComponent {
  @Input({ required: true }) plant!: Plant;
  @Input() adminMode = false;
  @Input() client?: Client;

  @Output() onEdit = new EventEmitter<Plant>();
  @Output() onRemove = new EventEmitter<Plant>();

  getWhatsappLink(): string {
    // Número actualizado como solicitaste
    const number = this.client?.whatsapp_number || '19392360534';
    
    // Mensaje pre-configurado profesional y persuasivo
    const message = `¡Hola! Me interesa la planta *${this.plant.name}* que vi en el catálogo de Verde Vida.\n\n*Precio:* $${this.plant.price}\n\n¿Podrían darme más información?`;
    
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}