import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plant, Client } from './services/plant.service';

@Component({
  selector: 'app-plant-card',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .plant-card {
      overflow: hidden;
      border: 1px solid #eef1ec;
      border-radius: 26px;
      background: #fff;
      box-shadow: 0 18px 50px rgba(16, 35, 25, 0.06);
      transition: 0.25s ease;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .plant-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 24px 60px rgba(16, 35, 25, 0.1);
    }
    .plant-img-wrap {
      position: relative;
      height: 235px;
      background: #f2f6ef;
      overflow: hidden;
    }
    .plant-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .stock-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      background: #ecfff3;
      color: #17613d;
      font-weight: 900;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.78rem;
    }
    .stock-badge.out {
      background: #fff0f0;
      color: #9b1c1c;
    }
    .plant-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .plant-category {
      color: #1f7a4d;
      font-size: 0.78rem;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    h3 {
      font-size: 1.35rem;
      color: #102319;
      margin: 0 0 8px;
    }
    .description {
      color: #5f6b61;
      font-size: 0.95rem;
      min-height: 48px;
      margin: 0;
    }
    .plant-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 18px 0;
    }
    .plant-meta span {
      background: #f4f8f1;
      border: 1px solid #e7efe2;
      border-radius: 999px;
      padding: 7px 10px;
      color: #435044;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .plant-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: auto;
    }
    .plant-footer strong {
      font-size: 1.5rem;
      color: #102319;
    }
    .whatsapp-btn {
      background: #25d366;
      color: white;
      text-decoration: none;
      padding: 12px 16px;
      border-radius: 12px;
      font-weight: 900;
      transition: 0.2s ease;
      cursor: pointer;
      border: 0;
    }
    .whatsapp-btn:hover {
      transform: translateY(-2px);
    }
    .whatsapp-btn.disabled {
      background: #b9b9b9;
      pointer-events: none;
    }
    .admin-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    .admin-actions button {
      flex: 1;
      border: 1px solid #dfe7dd;
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      cursor: pointer;
      font-weight: 800;
      transition: 0.2s ease;
    }
    .admin-actions button:hover {
      background: #f4f8f1;
    }
  `],
  template: `
    <article class="plant-card">
      <div class="plant-img-wrap">
        <img [src]="plant.image_url || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=900'" [alt]="plant.name">
        <span class="stock-badge" [class.out]="plant.stock <= 0">{{ plant.stock > 0 ? plant.stock + ' disponibles' : 'Agotada' }}</span>
      </div>
      
      <div class="plant-body">
        <p class="plant-category">{{ plant.category }}</p>
        <h3>{{ plant.name }}</h3>
        <p class="description">{{ plant.description }}</p>
        
        <div class="plant-meta">
          <span>{{ plant.light || 'Luz variable' }}</span>
          <span>{{ plant.water || 'Riego regular' }}</span>
        </div>
        
        <div class="plant-footer">
          <strong>\${{ plant.price }}</strong>
          <a class="whatsapp-btn" 
             [class.disabled]="plant.stock <= 0" 
             [href]="plant.stock > 0 ? getWhatsappLink() : null" 
             target="_blank">
            Ordenar
          </a>
        </div>
        
        <div class="admin-actions" *ngIf="adminMode">
          <button (click)="onEdit.emit(plant)">Editar</button>
          <button (click)="onRemove.emit(plant)">Ocultar</button>
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
    const number = this.client?.whatsapp_number || '17876195211';
    const message = `Hola, me interesa esta planta:\n\nNombre: ${this.plant.name}\nPrecio: $${this.plant.price}\nStock: ${this.plant.stock}\n\n¿Está disponible?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}