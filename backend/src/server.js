import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant } from '../services/plant.service';
import { PlantCardComponent } from '../plant-card.component';

export const PLANT_CATEGORIES = [
  'Árboles', 'Arbustos', 'Flores de estación', 'Plantas de interior',
  'Trepadoras', 'Suculentas', 'Palmas'
];

const CHART_COLORS = ['#14452F','#4caf78','#f5c842','#9ecfb0','#e07b54','#6b8f71','#a78bfa','#38bdf8'];

interface RestockItem {
  plant_name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  current_sale_price: number | null;
  row_margin: number;
  apply_suggested_price: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent, DecimalPipe],
  styles: [`
    .metric-card { background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;text-align:center;box-shadow:0 4px 12px rgba(16,35,25,0.04); }
    .section-title { margin:0 0 4px 0;color:#102319;font-size:1.25rem;font-weight:700; }
    .section-sub { margin:0 0 16px 0;color:#516052;font-size:0.85rem; }
    .form-input { padding:12px 14px;border-radius:12px;border:1px solid #dfe7dd;font-size:0.92rem;outline:none;width:100%;box-sizing:border-box; }
    .form-label { display:block;font-size:0.75rem;font-weight:700;color:#516052;margin-bottom:5px;letter-spacing:0.3px; }
    .form-group { display:flex;flex-direction:column; }
    .btn-primary { background:#14452F;color:white;padding:12px 20px;border:none;border-radius:99px;cursor:pointer;font-weight:700;font-size:0.92rem; }
    .btn-primary:hover { background:#0d3320; }
    .btn-secondary { background:#f4f8f1;color:#102319;padding:12px 20px;border:1px solid #dfe7dd;border-radius:99px;cursor:pointer;font-weight:600;font-size:0.92rem; }
    .admin-inventory { display:flex;flex-direction:column;gap:10px; }
    select.form-input { appearance:auto; }
    .profit-positive { color:#15803d; font-weight:700; }
    .profit-negative { color:#dc2626; font-weight:700; }
    .profit-neutral  { color:#516052; font-weight:600; }
    .restock-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    .restock-table th { background:#f4f8f1; color:#516052; font-weight:700; padding:10px 12px; text-align:left; font-size:0.72rem; letter-spacing:0.3px; }
    .restock-table td { padding:10px 12px; border-bottom:1px solid #f0f0f0; vertical-align:middle; }
    .restock-table tr:last-child td { border-bottom:none; }
    .restock-table input[type=number] { width:80px; padding:6px 8px; border:1px solid #dfe7dd; border-radius:8px; font-size:0.82rem; outline:none; }
    .tag-suggested { background:#fef3c7; color:#92400e; font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:6px; }
    .tag-ok { background:#dcfce7; color:#15803d; font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:6px; }
    .tag-warn { background:#fee2e2; color:#991b1b; font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:6px; }
  `],
  template: `
    <!-- HEADER -->
    <header style="background:#14452F;color:white;display:flex;justify-content:space-between;align-items:center;padding:12px 20px;position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(20,69,47,0.18);">
      <button (click)="goToPublic()" style="background:none;border:none;color:rgba(255,255,255,0.75);cursor:pointer;font-size:0.82rem;font-weight:500;display:flex;align-items:center;gap:5px;padding:0;">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"/></svg>
        Ver tienda
      </button>
      <div style="text-align:center;">
        <div style="font-size:0.95rem;font-weight:700;color:white;">Panel de Administración</div>
        <div style="font-size:0.65rem;color:#A3C4B3;">Demo Garden PR</div>
      </div>
      <button (click)="logout()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:0.78rem;">
        Salir
      </button>
    </header>

    <div style="max-width:1100px;margin:0 auto;padding:20px 16px 60px;">

      <!-- ── 1. DASHBOARD ── -->
      <div style="margin-bottom:22px;">
        <h2 class="section-title">Dashboard</h2>
        <p class="section-sub">Resumen del inventario en tiempo real.</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:11px;margin-bottom:14px;">
          <div class="metric-card">
            <div style="font-size:1.8rem;font-weight:800;color:#102319;line-height:1;">{{ plants.length }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Total Plantas</div>
          </div>
          <div class="metric-card">
            <div style="font-size:1.8rem;font-weight:800;color:#1f7a4d;line-height:1;">{{ totalStock }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Total en Stock</div>
          </div>
          <div class="metric-card" style="border-color:#fef3c7;">
            <div style="font-size:1.8rem;font-weight:800;color:#d97706;line-height:1;">{{ lowStockPlants.length }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Bajo Stock</div>
          </div>
          <div class="metric-card" style="border-color:#fee2e2;">
            <div style="font-size:1.8rem;font-weight:800;color:#dc2626;line-height:1;">{{ outOfStockPlants.length }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Sin Stock</div>
          </div>
          <div style="background:linear-gradient(135deg,#102319,#1f7a4d);border-radius:20px;padding:20px;text-align:center;box-shadow:0 4px 12px rgba(31,122,77,0.18);">
            <div style="font-size:1.3rem;font-weight:800;color:white;line-height:1;">\${{ estimatedInventoryValue | number:'1.0-0' }}</div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.75);font-weight:600;margin-top:5px;">Valor Estimado</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;">
          <!-- Donut -->
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 16px 0;color:#102319;font-size:0.9rem;font-weight:700;">Inventario por categoría</h3>
            <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">
              <svg width="130" height="130" viewBox="0 0 130 130" style="flex-shrink:0;">
                <ng-container *ngFor="let seg of donutSegments">
                  <circle cx="65" cy="65" r="44" fill="none"
                    [attr.stroke]="seg.color" stroke-width="22"
                    [attr.stroke-dasharray]="seg.dashArray"
                    [attr.stroke-dashoffset]="seg.dashOffset"
                    style="transform:rotate(-90deg);transform-origin:65px 65px;">
                  </circle>
                </ng-container>
                <text x="65" y="61" text-anchor="middle" style="font-size:18px;font-weight:800;fill:#102319;">{{ plants.length }}</text>
                <text x="65" y="76" text-anchor="middle" style="font-size:9px;fill:#516052;">Total</text>
              </svg>
              <div style="flex:1;min-width:120px;display:flex;flex-direction:column;gap:7px;">
                <div *ngFor="let seg of donutSegments" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;" [style.background]="seg.color"></span>
                    <span style="font-size:0.78rem;color:#102319;">{{ seg.category }}</span>
                  </div>
                  <span style="font-size:0.74rem;color:#516052;font-weight:600;">{{ seg.count }} ({{ seg.percent }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Low stock list -->
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 4px 0;color:#102319;font-size:0.9rem;font-weight:700;">Productos con bajo stock</h3>
            <p style="margin:0 0 12px 0;color:#516052;font-size:0.75rem;">≤5 unidades disponibles</p>
            <div *ngIf="lowStockPlants.length === 0" style="text-align:center;padding:14px;color:#aaa;font-size:0.85rem;">✅ Inventario bien surtido</div>
            <div *ngFor="let p of lowStockPlants" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f4f4f4;">
              <div style="width:40px;height:40px;border-radius:10px;overflow:hidden;background:#f4f8f1;flex-shrink:0;">
                <img *ngIf="p.image_url" [src]="p.image_url" style="width:100%;height:100%;object-fit:cover;">
                <div *ngIf="!p.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🪴</div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;color:#102319;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div>
                <div style="color:#dc2626;font-size:0.74rem;font-weight:600;">{{ p.stock }} {{ p.stock === 1 ? 'unidad' : 'unidades' }}</div>
              </div>
              <div style="font-weight:700;color:#1f7a4d;font-size:0.88rem;">\${{ p.price }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 2. AI RESTOCK ── -->
      <div style="background:linear-gradient(135deg,#0d3320,#1a5c38 60%,#236b45);border-radius:22px;padding:26px;margin-bottom:22px;box-shadow:0 16px 48px rgba(15,50,30,0.2);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:rgba(255,255,255,0.04);border-radius:50%;pointer-events:none;"></div>
        <div style="position:relative;z-index:1;">
          <span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:white;font-size:0.68rem;font-weight:800;letter-spacing:1.5px;padding:4px 11px;border-radius:99px;display:inline-block;margin-bottom:12px;">✨ AI RESTOCK</span>
          <h2 style="color:white;font-size:1.55rem;font-weight:800;margin:0 0 7px;letter-spacing:-0.5px;">AI Restock Assistant</h2>
          <p style="color:rgba(255,255,255,0.85);font-size:0.9rem;margin:0 0 4px;font-weight:500;">Actualiza tu inventario subiendo una factura del suplidor.</p>
          <p style="color:rgba(255,255,255,0.6);font-size:0.82rem;margin:0 0 20px;">El sistema detecta plantas, cantidades y costos. El precio de venta público no se toca — tú decides si aplicar el precio sugerido.</p>

          <!-- Margen deseado -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;">
              <span style="color:rgba(255,255,255,0.75);font-size:0.8rem;font-weight:600;white-space:nowrap;">Margen deseado:</span>
              <input type="number" [(ngModel)]="desiredMargin" min="1" max="99"
                style="width:60px;padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);color:white;font-size:0.88rem;font-weight:700;text-align:center;outline:none;">
              <span style="color:rgba(255,255,255,0.75);font-size:0.8rem;">%</span>
            </div>
            <span style="color:rgba(255,255,255,0.5);font-size:0.76rem;">Usado para calcular precio sugerido cuando no hay precio de venta.</span>
          </div>

          <!-- Upload -->
          <div style="background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.2);border-radius:14px;padding:16px;">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
              <label style="display:flex;align-items:center;gap:7px;background:white;color:#102319;border-radius:10px;padding:9px 16px;font-weight:700;font-size:0.85rem;cursor:pointer;white-space:nowrap;">
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir factura
                <input type="file" (change)="onInvoiceSelected($event)" accept="image/*,.pdf" style="display:none;">
              </label>
              <span style="color:rgba(255,255,255,0.55);font-size:0.8rem;flex:1;min-width:90px;">
                {{ selectedInvoice ? '📎 ' + selectedInvoice.name : 'JPG, PNG o PDF' }}
              </span>
              <button [disabled]="!selectedInvoice || invoiceLoading" (click)="analyzeInvoice()"
                style="padding:10px 20px;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.85rem;transition:all 0.2s;"
                [style.background]="(!selectedInvoice || invoiceLoading) ? 'rgba(255,255,255,0.12)' : '#4ade80'"
                [style.color]="(!selectedInvoice || invoiceLoading) ? 'rgba(255,255,255,0.35)' : '#052e16'">
                {{ invoiceLoading ? '⏳ Analizando...' : '🤖 Analizar con AI' }}
              </button>
            </div>
          </div>

          <!-- Results table -->
          <div *ngIf="restockItems.length" style="background:white;border-radius:16px;margin-top:16px;overflow:hidden;">
            <div style="padding:16px 20px 12px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <h3 style="margin:0;color:#102319;font-size:0.95rem;font-weight:700;">Plantas detectadas — Análisis de rentabilidad</h3>
              <span style="font-size:0.75rem;color:#516052;">{{ restockItems.length }} item(s)</span>
            </div>

            <div style="overflow-x:auto;">
              <table class="restock-table">
                <thead>
                  <tr>
                    <th>Planta</th>
                    <th>Cant.</th>
                    <th>Costo unit.</th>
                    <th>Costo total</th>
                    <th>Precio venta</th>
                    <th>Margen deseado</th>
                    <th>Precio sugerido</th>
                    <th>Ganancia / Margen real</th>
                    <th>Usar sugerido</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of restockItems; let i = index">

                    <!-- Nombre -->
                    <td>
                      <input type="text" [(ngModel)]="item.plant_name"
                        style="width:130px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;">
                    </td>

                    <!-- Cantidad -->
                    <td>
                      <input type="number" [(ngModel)]="item.quantity" min="1"
                        style="width:55px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;">
                    </td>

                    <!-- Costo unitario -->
                    <td>
                      <div style="display:flex;align-items:center;gap:3px;">
                        <span style="color:#9ca3af;font-size:0.78rem;">$</span>
                        <input type="number" [(ngModel)]="item.unit_cost" step="0.01" min="0"
                          style="width:65px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;">
                      </div>
                    </td>

                    <!-- Costo total -->
                    <td style="color:#516052;font-weight:600;white-space:nowrap;">
                      \${{ (item.unit_cost * item.quantity) | number:'1.2-2' }}
                    </td>

                    <!-- Precio venta EDITABLE -->
                    <td>
                      <div style="display:flex;align-items:center;gap:3px;">
                        <span style="color:#9ca3af;font-size:0.78rem;">$</span>
                        <input type="number" [(ngModel)]="item.current_sale_price" step="0.01" min="0"
                          placeholder="Precio venta"
                          style="width:70px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;"
                          [style.borderColor]="!item.current_sale_price && !item.apply_suggested_price ? '#fca5a5' : '#dfe7dd'">
                      </div>
                      <div *ngIf="!item.current_sale_price && !item.apply_suggested_price"
                        style="font-size:0.65rem;color:#dc2626;margin-top:2px;">Requerido</div>
                    </td>

                    <!-- Margen deseado EDITABLE por fila -->
                    <td>
                      <div style="display:flex;align-items:center;gap:3px;">
                        <input type="number" [(ngModel)]="item.row_margin" min="1" max="99"
                          style="width:46px;padding:6px 6px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;text-align:center;">
                        <span style="color:#9ca3af;font-size:0.78rem;">%</span>
                      </div>
                    </td>

                    <!-- Precio sugerido (calculado en tiempo real) -->
                    <td style="white-space:nowrap;">
                      <span style="font-weight:700;color:#1f7a4d;">
                        \${{ getRowSuggestedPrice(item) | number:'1.2-2' }}
                      </span>
                      <div class="tag-suggested" style="margin-top:2px;display:inline-block;">
                        {{ item.row_margin }}% margen
                      </div>
                    </td>

                    <!-- Ganancia / Margen real (usa precio efectivo) -->
                    <td style="white-space:nowrap;">
                      <ng-container *ngIf="getEffectivePrice(item) > 0">
                        <div [class]="getRowProfitClass(item)">
                          \${{ getRowProfit(item) | number:'1.2-2' }}
                        </div>
                        <div style="font-size:0.72rem;color:#516052;">
                          {{ getRowMargin(item) | number:'1.0-1' }}%
                        </div>
                        <span [class]="getRowMarginTag(item)">{{ getRowMarginLabel(item) }}</span>
                      </ng-container>
                      <span *ngIf="getEffectivePrice(item) <= 0" style="color:#aaa;font-size:0.78rem;">—</span>
                    </td>

                    <!-- Checkbox usar sugerido -->
                    <td style="text-align:center;">
                      <input type="checkbox" [(ngModel)]="item.apply_suggested_price"
                        style="width:16px;height:16px;accent-color:#14452F;cursor:pointer;">
                    </td>

                    <!-- Borrar -->
                    <td>
                      <button (click)="removeRestockItem(i)"
                        style="background:#fff0f0;border:none;color:#9b1c1c;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700;font-size:0.8rem;">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div style="padding:14px 20px;background:#f9fdf9;border-top:1px solid #eef1ec;display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
              <div style="font-size:0.8rem;color:#516052;">
                <span style="font-weight:700;color:#102319;">Costo total factura:</span>
                \${{ totalInvoiceCost | number:'1.2-2' }}
              </div>
              <div style="font-size:0.8rem;color:#516052;">
                <span style="font-weight:700;color:#102319;">Usando precio sugerido:</span>
                {{ countApplied() }} de {{ restockItems.length }}
              </div>
            </div>

            <div style="padding:14px 20px 18px;display:flex;flex-wrap:wrap;gap:10px;">
              <button (click)="confirmRestock()" class="btn-primary" style="flex:1;min-width:160px;">✅ Confirmar actualización</button>
              <button (click)="cancelInvoice()" class="btn-secondary" style="flex:1;min-width:130px;">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 3. INVENTARIO ── -->
      <div style="margin-bottom:22px;">
        <h2 class="section-title">Inventario</h2>
        <p class="section-sub">{{ plants.length }} plantas en el catálogo.</p>
        <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;">🌱 Cargando...</div>
        <div class="admin-inventory" *ngIf="!loading">
          <app-plant-card *ngFor="let p of plants" [plant]="p" [adminMode]="true" [client]="client"
            (onEdit)="editPlant($event)" (onRemove)="removePlant($event)">
          </app-plant-card>
          <div *ngIf="plants.length === 0" style="text-align:center;padding:28px;color:#888;font-size:0.9rem;">No hay plantas aún.</div>
        </div>
      </div>

      <!-- ── 4. FORMULARIO ── -->
      <div id="plant-form" style="background:white;border-radius:22px;padding:24px;border:1px solid #eef1ec;box-shadow:0 4px 16px rgba(16,35,25,0.04);">
        <h2 class="section-title">{{ editingId ? '✏️ Editar Planta' : '🌱 Nueva Planta' }}</h2>
        <p class="section-sub">{{ editingId ? 'Modifica los datos de la planta.' : 'Agrega una nueva planta al catálogo.' }}</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:13px;">
          <div class="form-group">
            <label class="form-label">Nombre de la planta</label>
            <input type="text" [(ngModel)]="plantForm.name" class="form-input" placeholder="Ej. Monstera Deliciosa">
          </div>
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select [(ngModel)]="plantForm.category" class="form-input">
              <option value="" disabled>Selecciona una categoría</option>
              <option *ngFor="let cat of PLANT_CATEGORIES" [value]="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Precio de venta</label>
            <input type="number" [(ngModel)]="plantForm.price" class="form-input" placeholder="Precio público">
          </div>
          <div class="form-group">
            <label class="form-label">Costo de compra</label>
            <input type="number" [(ngModel)]="plantForm.cost_price" class="form-input" placeholder="Costo mayorista">
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad disponible</label>
            <input type="number" [(ngModel)]="plantForm.stock" class="form-input" placeholder="Stock">
          </div>
          <div class="form-group">
            <label class="form-label">Imagen</label>
            <div style="position:relative;border:2px dashed #dfe7dd;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:46px;background:#fafdf8;cursor:pointer;">
              <input type="file" accept="image/*" (change)="uploadPlantImage($event)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
              <span style="color:#516052;font-weight:600;font-size:0.85rem;pointer-events:none;">
                {{ imageUploading ? '⏳ Subiendo...' : plantForm.image_url ? '✅ Imagen subida' : '📷 Subir imagen' }}
              </span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Luz</label>
            <input type="text" [(ngModel)]="plantForm.light" class="form-input" placeholder="Ej. Sol parcial, Luz indirecta">
          </div>
          <div class="form-group">
            <label class="form-label">Agua / Riego</label>
            <input type="text" [(ngModel)]="plantForm.water" class="form-input" placeholder="Ej. Moderada, Poca">
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Descripción</label>
            <textarea [(ngModel)]="plantForm.description" class="form-input" style="min-height:76px;resize:vertical;" placeholder="Descripción breve de la planta..."></textarea>
          </div>
          <div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;">
            <input type="checkbox" [(ngModel)]="plantForm.is_featured" id="featured" style="width:17px;height:17px;accent-color:#14452F;">
            <label for="featured" style="color:#102319;font-weight:500;cursor:pointer;font-size:0.9rem;">Destacar planta</label>
          </div>
          <div style="grid-column:1/-1;display:flex;gap:11px;flex-wrap:wrap;margin-top:4px;">
            <button (click)="savePlant()" class="btn-primary" style="flex:1;min-width:130px;">
              {{ editingId ? '✅ Actualizar Planta' : '➕ Crear Planta' }}
            </button>
            <button (click)="resetForm()" class="btn-secondary" style="flex:1;min-width:130px;">Limpiar formulario</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminComponent implements OnInit {
  readonly PLANT_CATEGORIES = PLANT_CATEGORIES;

  clientSlug = 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  loading = true;
  plantForm: Plant = this.emptyPlant();
  editingId?: number;
  imageUploading = false;

  // AI Restock
  selectedInvoice: File | null = null;
  invoiceLoading = false;
  restockItems: RestockItem[] = [];
  desiredMargin = 50; // %

  constructor(private plantService: PlantService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (sessionStorage.getItem('admin_slug') !== this.clientSlug) { this.router.navigate(['/']); return; }
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

  logout() { sessionStorage.removeItem('admin_slug'); this.router.navigate(['/']); }
  goToPublic() { this.router.navigate(['/']); }

  // ── METRICS ──
  get totalStock() { return this.plants.reduce((s,p) => s + (p.stock||0), 0); }
  get lowStockPlants() { return this.plants.filter(p => p.stock > 0 && p.stock <= 5); }
  get outOfStockPlants() { return this.plants.filter(p => p.stock <= 0); }
  get estimatedInventoryValue() { return this.plants.reduce((s,p) => s + ((p.price||0)*(p.stock||0)), 0); }

  get donutSegments() {
    const c = 2 * Math.PI * 44;
    const map = new Map<string,number>();
    this.plants.forEach(p => { const k = p.category||'Sin categoría'; map.set(k,(map.get(k)||0)+1); });
    const total = this.plants.length || 1;
    let offset = 0; let ci = 0; const segs: any[] = [];
    map.forEach((count,category) => {
      const pct = count/total; const dash = pct*c;
      segs.push({ category, count, percent: Math.round(pct*100), color: CHART_COLORS[ci%CHART_COLORS.length], dashArray:`${dash} ${c}`, dashOffset:-offset });
      offset += dash; ci++;
    });
    return segs;
  }

  // ── PROFITABILITY HELPERS (per-row, real-time) ──

  // Suggested price using per-row margin
  getRowSuggestedPrice(item: RestockItem): number {
    if (!item.unit_cost || item.row_margin >= 100) return 0;
    return item.unit_cost / (1 - item.row_margin / 100);
  }

  // Effective price = suggested if checkbox, else manual sale price
  getEffectivePrice(item: RestockItem): number {
    if (item.apply_suggested_price) return this.getRowSuggestedPrice(item);
    return item.current_sale_price ?? 0;
  }

  getRowProfit(item: RestockItem): number {
    const p = this.getEffectivePrice(item);
    if (!p) return 0;
    return p - item.unit_cost;
  }

  getRowMargin(item: RestockItem): number {
    const p = this.getEffectivePrice(item);
    if (!p || !item.unit_cost) return 0;
    return (this.getRowProfit(item) / p) * 100;
  }

  getRowProfitClass(item: RestockItem): string {
    const p = this.getRowProfit(item);
    return p > 0 ? 'profit-positive' : p < 0 ? 'profit-negative' : 'profit-neutral';
  }

  getRowMarginLabel(item: RestockItem): string {
    const m = this.getRowMargin(item);
    if (m >= 40) return '✅ Buen margen';
    if (m >= 20) return '⚠️ Margen bajo';
    return '🔴 Sin margen';
  }

  getRowMarginTag(item: RestockItem): string {
    const m = this.getRowMargin(item);
    return m >= 40 ? 'tag-ok' : m >= 20 ? 'tag-suggested' : 'tag-warn';
  }

  // Legacy — keep for global suggested price field
  getSuggestedPrice(unitCost: number): number {
    if (!unitCost || this.desiredMargin >= 100) return 0;
    return unitCost / (1 - this.desiredMargin / 100);
  }

  countApplied(): number {
    return this.restockItems.filter(i => i.apply_suggested_price).length;
  }

  get totalInvoiceCost(): number {
    return this.restockItems.reduce((s,i) => s + (i.unit_cost * i.quantity), 0);
  }

  // ── AI RESTOCK ──
  onInvoiceSelected(event: any) { const f = event.target.files[0]; if (f) this.selectedInvoice = f; }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    this.plantService.analyzeInvoice(this.selectedInvoice).subscribe({
      next: (res) => {
        this.restockItems = this.buildRestockItems(res.items || []);
        this.invoiceLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.invoiceLoading = false;
        // Mock fallback
        this.restockItems = this.buildRestockItems([
          { plant_name: 'Ficus Lyrata', quantity: 5, unit_cost: 15.00 },
          { plant_name: 'Monstera Deliciosa', quantity: 3, unit_cost: 10.00 },
        ]);
        this.cdr.detectChanges();
      }
    });
  }

  buildRestockItems(raw: any[]): RestockItem[] {
    return raw.map(r => {
      const match = this.plants.find(p => p.name.toLowerCase().includes((r.plant_name||'').toLowerCase()));
      const hasPrice = match?.price != null && match.price > 0;
      return {
        plant_name: r.plant_name || '',
        category: r.category || match?.category || '',
        quantity: r.quantity || 1,
        unit_cost: r.unit_cost || 0,
        total_cost: (r.unit_cost || 0) * (r.quantity || 1),
        current_sale_price: match?.price ?? null,
        row_margin: this.desiredMargin,         // default from global, editable per row
        apply_suggested_price: !hasPrice,       // auto-check if no price exists
      };
    });
  }

  removeRestockItem(i: number) { this.restockItems.splice(i, 1); }

  confirmRestock() {
    if (!this.restockItems.length) return;

    // Validate: every item must have an effective price
    const invalid = this.restockItems.filter(item => this.getEffectivePrice(item) <= 0);
    if (invalid.length) {
      alert(`Falta el precio de venta en: ${invalid.map(i => i.plant_name).join(', ')}\nIngresa un precio manual o activa "Usar sugerido".`);
      return;
    }

    const items = this.restockItems.map(item => ({
      plant_name: item.plant_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      new_price: this.getEffectivePrice(item),   // always send final price
      target_margin: item.row_margin,
    }));

    this.plantService.restockPlants(this.clientSlug, items).subscribe({
      next: () => { this.cancelInvoice(); this.loadData(); alert('¡Inventario actualizado!'); },
      error: e => console.error(e)
    });
  }

  cancelInvoice() { this.selectedInvoice = null; this.restockItems = []; }

  // ── CRUD ──
  savePlant() {
    if (!this.plantForm.name) return;
    const req = this.editingId ? this.plantService.updatePlant(this.editingId, this.plantForm) : this.plantService.createPlant(this.clientSlug, this.plantForm);
    req.subscribe({ next: () => { this.resetForm(); this.loadData(); }, error: e => console.error(e) });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    setTimeout(() => document.getElementById('plant-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  removePlant(plant: Plant) {
    if (!plant.id) return;
    if (confirm(`¿Eliminar ${plant.name}?`)) {
      this.plantService.deletePlant(plant.id).subscribe({ next: () => this.loadData(), error: e => console.error(e) });
    }
  }

  resetForm() { this.editingId = undefined; this.plantForm = this.emptyPlant(); }

  emptyPlant(): Plant {
    return { name:'', category:'', description:'', price: null as any, cost_price: null, stock: null as any, image_url:'', light:'', water:'', is_featured:false, is_active:true };
  }

  uploadPlantImage(event: any) {
    const file = event.target.files[0]; if (!file) return;
    this.imageUploading = true;
    this.plantService.uploadImage(file).subscribe({
      next: (res) => { this.plantForm.image_url = res.url; this.imageUploading = false; this.cdr.detectChanges(); },
      error: () => { this.imageUploading = false; }
    });
  }
}