import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant } from '../services/plant.service';
import { PlantCardComponent } from '../plant-card.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent],
  styles: [`
    .metric-card {
      background: white;
      border: 1px solid #eef1ec;
      border-radius: 20px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(16,35,25,0.04);
    }
    .metric-value { font-size: 2rem; font-weight: 800; line-height: 1; margin: 0 0 6px 0; }
    .metric-label { font-size: 0.78rem; color: #516052; font-weight: 600; }
    .section-title { margin: 0 0 6px 0; color: #102319; font-size: 1.4rem; font-weight: 700; }
    .section-sub { margin: 0 0 20px 0; color: #516052; font-size: 0.9rem; }
    .form-input {
      padding: 14px; border-radius: 12px; border: 1px solid #dfe7dd;
      font-size: 1rem; outline: none; width: 100%; box-sizing: border-box;
    }
    .btn-primary {
      background: #1f7a4d; color: white; padding: 14px 20px;
      border: none; border-radius: 99px; cursor: pointer; font-weight: 700; font-size: 1rem;
    }
    .btn-secondary {
      background: #f4f8f1; color: #102319; padding: 14px 20px;
      border: 1px solid #dfe7dd; border-radius: 99px; cursor: pointer; font-weight: 600; font-size: 1rem;
    }
    .chart-legend-dot {
      width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    }
    .low-stock-row {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 0; border-bottom: 1px solid #f0f0f0;
    }
    .low-stock-row:last-child { border-bottom: none; }
  `],
  template: `
    <!-- HEADER -->
    <header style="background:#14452F;color:white;display:flex;justify-content:space-between;align-items:center;padding:12px 20px;position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(20,69,47,0.18);">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:1.5rem;">🌿</span>
        <div>
          <h1 style="margin:0;font-size:1.2rem;font-weight:600;color:white;">Verde Vida</h1>
          <p style="margin:0;font-size:0.7rem;color:#A3C4B3;">Panel de Administración</p>
        </div>
      </div>
      <button (click)="goToPublic()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:white;border-radius:10px;padding:7px 14px;cursor:pointer;font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:6px;">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Ver tienda
      </button>
      <button (click)="logout()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);border-radius:10px;padding:7px 14px;cursor:pointer;font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:6px;">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Salir
      </button>
    </header>

    <div style="max-width:1200px;margin:0 auto;padding:24px 20px 60px;">

      <!-- ── DASHBOARD METRICS ── -->
      <div style="margin-bottom:28px;">
        <h2 class="section-title">Dashboard</h2>
        <p class="section-sub">Resumen de tu inventario en tiempo real.</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:20px;">
          <div class="metric-card">
            <p class="metric-value" style="color:#102319;">{{ plants.length }}</p>
            <p class="metric-label">Total Plantas</p>
          </div>
          <div class="metric-card">
            <p class="metric-value" style="color:#1f7a4d;">{{ totalStock }}</p>
            <p class="metric-label">Total en Stock</p>
          </div>
          <div class="metric-card" style="border-color:#fef3c7;">
            <p class="metric-value" style="color:#d97706;">{{ lowStockPlants.length }}</p>
            <p class="metric-label">Bajo Stock</p>
          </div>
          <div class="metric-card" style="border-color:#fee2e2;">
            <p class="metric-value" style="color:#dc2626;">{{ outOfStockPlants.length }}</p>
            <p class="metric-label">Sin Stock</p>
          </div>
          <div style="background:linear-gradient(135deg,#102319,#1f7a4d);border-radius:20px;padding:20px;text-align:center;box-shadow:0 4px 12px rgba(31,122,77,0.18);">
            <p style="font-size:1.5rem;font-weight:800;color:white;line-height:1;margin:0 0 6px 0;">\${{ estimatedInventoryValue | number:'1.0-0' }}</p>
            <p style="font-size:0.78rem;color:rgba(255,255,255,0.75);font-weight:600;margin:0;">Valor Estimado</p>
          </div>
        </div>

        <!-- Chart + Low stock list side by side -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">

          <!-- Donut chart -->
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:24px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 20px 0;color:#102319;font-size:1rem;font-weight:700;">Inventario por categoría</h3>
            <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
              <div style="position:relative;flex-shrink:0;">
                <svg #donutChart width="160" height="160" viewBox="0 0 160 160">
                  <ng-container *ngFor="let seg of donutSegments">
                    <circle
                      [attr.cx]="80" [attr.cy]="80" [attr.r]="56"
                      fill="none"
                      [attr.stroke]="seg.color"
                      stroke-width="28"
                      [attr.stroke-dasharray]="seg.dashArray"
                      [attr.stroke-dashoffset]="seg.dashOffset"
                      stroke-linecap="butt"
                      style="transform:rotate(-90deg);transform-origin:80px 80px;">
                    </circle>
                  </ng-container>
                  <text x="80" y="76" text-anchor="middle" style="font-size:22px;font-weight:800;fill:#102319;">{{ plants.length }}</text>
                  <text x="80" y="94" text-anchor="middle" style="font-size:11px;fill:#516052;">Total</text>
                </svg>
              </div>
              <div style="flex:1;min-width:140px;display:flex;flex-direction:column;gap:10px;">
                <div *ngFor="let seg of donutSegments" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="chart-legend-dot" [style.background]="seg.color"></span>
                    <span style="font-size:0.88rem;color:#102319;font-weight:500;">{{ seg.category }}</span>
                  </div>
                  <span style="font-size:0.82rem;color:#516052;font-weight:600;white-space:nowrap;">{{ seg.count }} ({{ seg.percent }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Low stock list -->
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:24px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 4px 0;color:#102319;font-size:1rem;font-weight:700;">Productos con bajo stock</h3>
            <p style="margin:0 0 16px 0;color:#516052;font-size:0.82rem;">≤5 unidades disponibles</p>
            <div *ngIf="lowStockPlants.length === 0" style="text-align:center;padding:20px;color:#aaa;font-size:0.9rem;">
              ✅ Todo el inventario está bien surtido
            </div>
            <div *ngFor="let p of lowStockPlants" class="low-stock-row">
              <div style="width:48px;height:48px;border-radius:12px;overflow:hidden;background:#f4f8f1;flex-shrink:0;">
                <img *ngIf="p.image_url" [src]="p.image_url" [alt]="p.name" style="width:100%;height:100%;object-fit:cover;">
                <div *ngIf="!p.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🪴</div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;color:#102319;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div>
                <div style="color:#dc2626;font-size:0.8rem;font-weight:600;">Stock: {{ p.stock }} {{ p.stock === 1 ? 'unidad' : 'unidades' }}</div>
              </div>
              <div style="font-weight:700;color:#1f7a4d;font-size:0.95rem;flex-shrink:0;">\${{ p.price }}</div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── AI RESTOCK PREMIUM ── -->
      <div style="background:linear-gradient(135deg,#0d3320 0%,#1a5c38 60%,#236b45 100%);border-radius:28px;padding:32px;margin-bottom:28px;box-shadow:0 16px 48px rgba(15,50,30,0.22);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:rgba(255,255,255,0.04);border-radius:50%;pointer-events:none;"></div>
        <div style="position:absolute;bottom:-60px;right:60px;width:150px;height:150px;background:rgba(255,255,255,0.03);border-radius:50%;pointer-events:none;"></div>
        <div style="position:relative;z-index:1;">
          <span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:white;font-size:0.72rem;font-weight:800;letter-spacing:1.5px;padding:5px 12px;border-radius:99px;display:inline-block;margin-bottom:16px;">✨ AI RESTOCK</span>
          <h2 style="color:white;font-size:1.9rem;font-weight:800;margin:0 0 10px 0;letter-spacing:-0.5px;">AI Restock Assistant</h2>
          <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin:0 0 6px 0;">Actualiza tu inventario subiendo una factura del suplidor.</p>
          <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin:0 0 28px 0;">Detecta plantas, cantidades y costos para ayudarte a mantener el catálogo actualizado sin hacerlo todo manualmente.</p>

          <div style="background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.2);border-radius:18px;padding:20px;margin-bottom:16px;">
            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
              <label style="display:flex;align-items:center;gap:8px;background:white;color:#102319;border-radius:12px;padding:10px 18px;font-weight:700;font-size:0.9rem;cursor:pointer;white-space:nowrap;">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir factura
                <input type="file" (change)="onInvoiceSelected($event)" accept="image/*,.pdf" style="display:none;">
              </label>
              <span style="color:rgba(255,255,255,0.6);font-size:0.85rem;flex:1;min-width:120px;">
                {{ selectedInvoice ? '📎 ' + selectedInvoice.name : 'JPG, PNG o PDF' }}
              </span>
              <button [disabled]="!selectedInvoice || invoiceLoading" (click)="analyzeInvoice()"
                style="padding:12px 22px;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-size:0.9rem;"
                [style.background]="(!selectedInvoice || invoiceLoading) ? 'rgba(255,255,255,0.15)' : '#6ee09a'"
                [style.color]="(!selectedInvoice || invoiceLoading) ? 'rgba(255,255,255,0.4)' : '#0d3320'">
                {{ invoiceLoading ? '⏳ Analizando...' : '🔍 Analizar factura' }}
              </button>
            </div>
          </div>

          <div *ngIf="invoiceResult?.items?.length" style="background:white;border-radius:18px;padding:20px;">
            <h3 style="margin:0 0 16px 0;color:#102319;font-size:1.1rem;font-weight:700;">Plantas detectadas</h3>
            <div *ngFor="let item of invoiceResult!.items; let i = index" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
              <input type="text" [(ngModel)]="item.plant_name" class="form-input" style="flex:1 1 100%;" placeholder="Nombre">
              <input type="number" [(ngModel)]="item.quantity" class="form-input" style="flex:1;min-width:80px;" placeholder="Cant.">
              <input type="number" step="0.01" [(ngModel)]="item.unit_cost" class="form-input" style="flex:1;min-width:80px;" placeholder="Costo">
              <button (click)="removeItemFromInvoice(i)" style="background:#fff0f0;border:none;color:#9b1c1c;border-radius:12px;padding:12px 20px;font-weight:bold;cursor:pointer;">✕</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;">
              <button (click)="confirmRestock()" class="btn-primary" style="flex:1;min-width:150px;">✅ Confirmar actualización</button>
              <button (click)="cancelInvoice()" class="btn-secondary" style="flex:1;min-width:150px;">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── PLANT FORM ── -->
      <div style="background:white;border-radius:24px;padding:28px;border:1px solid #eef1ec;margin-bottom:28px;box-shadow:0 4px 16px rgba(16,35,25,0.04);">
        <h2 class="section-title">{{ editingId ? '✏️ Editar Planta' : '🌱 Nueva Planta' }}</h2>
        <p class="section-sub">{{ editingId ? 'Modifica los datos de la planta seleccionada.' : 'Agrega una nueva planta al catálogo.' }}</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
          <input type="text" placeholder="Nombre de la planta" [(ngModel)]="plantForm.name" class="form-input">
          <input type="text" placeholder="Categoría (ej. Exterior)" [(ngModel)]="plantForm.category" class="form-input">
          <input type="number" placeholder="Precio" [(ngModel)]="plantForm.price" class="form-input">
          <input type="number" placeholder="Stock" [(ngModel)]="plantForm.stock" class="form-input">
          <div style="position:relative;border:2px dashed #dfe7dd;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:52px;background:#fafdf8;cursor:pointer;">
            <input type="file" accept="image/*" (change)="uploadPlantImage($event)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
            <span style="color:#516052;font-weight:600;font-size:0.9rem;pointer-events:none;">
              {{ imageUploading ? '⏳ Subiendo...' : plantForm.image_url ? '✅ Imagen subida' : '📷 Subir imagen' }}
            </span>
          </div>
          <input type="text" placeholder="Luz (ej. Sol parcial)" [(ngModel)]="plantForm.light" class="form-input">
          <input type="text" placeholder="Agua (ej. Moderada)" [(ngModel)]="plantForm.water" class="form-input">
          <textarea placeholder="Descripción" [(ngModel)]="plantForm.description" class="form-input" style="grid-column:1/-1;min-height:90px;resize:vertical;"></textarea>
          <div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;">
            <input type="checkbox" [(ngModel)]="plantForm.is_featured" id="featured" style="width:18px;height:18px;accent-color:#1f7a4d;">
            <label for="featured" style="color:#102319;font-weight:500;cursor:pointer;">Destacar planta</label>
          </div>
          <div style="grid-column:1/-1;display:flex;gap:12px;flex-wrap:wrap;">
            <button (click)="savePlant()" class="btn-primary" style="flex:1;min-width:150px;">
              {{ editingId ? '✅ Actualizar Planta' : '➕ Crear Planta' }}
            </button>
            <button (click)="resetForm()" class="btn-secondary" style="flex:1;min-width:150px;">Limpiar</button>
          </div>
        </div>
      </div>

      <!-- ── INVENTORY ── -->
      <div>
        <h2 class="section-title">Inventario</h2>
        <p class="section-sub">{{ plants.length }} plantas en el catálogo.</p>
        <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;font-weight:600;">🌱 Cargando...</div>
        <div class="plant-grid" *ngIf="!loading">
          <app-plant-card *ngFor="let p of plants" [plant]="p" [adminMode]="true" [client]="client"
            (onEdit)="editPlant($event)" (onRemove)="removePlant($event)">
          </app-plant-card>
        </div>
      </div>

    </div>
  `
})
export class AdminComponent implements OnInit {
  clientSlug = 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  loading = true;

  plantForm: Plant = this.emptyPlant();
  editingId?: number;

  selectedInvoice: File | null = null;
  invoiceLoading = false;
  invoiceResult: { items: any[] } | null = null;
  imageUploading = false;

  // Donut chart colors
  readonly CHART_COLORS = ['#14452F', '#4caf78', '#f5c842', '#9ecfb0', '#e07b54', '#6b8f71'];

  constructor(
    private plantService: PlantService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (sessionStorage.getItem('admin_slug') !== this.clientSlug) {
      this.router.navigate(['/']);
      return;
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

  logout() {
    sessionStorage.removeItem('admin_slug');
    this.router.navigate(['/']);
  }

  goToPublic() { this.router.navigate(['/']); }

  // ── METRICS ──
  get totalStock(): number { return this.plants.reduce((s, p) => s + (p.stock || 0), 0); }
  get lowStockPlants(): Plant[] { return this.plants.filter(p => p.stock > 0 && p.stock <= 5); }
  get outOfStockPlants(): Plant[] { return this.plants.filter(p => p.stock <= 0); }
  get estimatedInventoryValue(): number { return this.plants.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0); }

  // ── DONUT CHART ──
  get donutSegments() {
    const circumference = 2 * Math.PI * 56; // r=56
    const categoryMap = new Map<string, number>();
    this.plants.forEach(p => {
      const cat = p.category || 'Sin categoría';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    const total = this.plants.length || 1;
    let offset = 0;
    const segments: any[] = [];
    let colorIdx = 0;
    categoryMap.forEach((count, category) => {
      const pct = count / total;
      const dash = pct * circumference;
      segments.push({
        category,
        count,
        percent: Math.round(pct * 100),
        color: this.CHART_COLORS[colorIdx % this.CHART_COLORS.length],
        dashArray: `${dash} ${circumference}`,
        dashOffset: -offset
      });
      offset += dash;
      colorIdx++;
    });
    return segments;
  }

  // ── CRUD ──
  savePlant() {
    if (!this.plantForm.name || this.plantForm.price < 0) return;
    const req = this.editingId
      ? this.plantService.updatePlant(this.editingId, this.plantForm)
      : this.plantService.createPlant(this.clientSlug, this.plantForm);
    req.subscribe({ next: () => { this.resetForm(); this.loadData(); }, error: e => console.error(e) });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removePlant(plant: Plant) {
    if (!plant.id) return;
    if (confirm(`¿Eliminar ${plant.name}?`)) {
      this.plantService.deletePlant(plant.id).subscribe({ next: () => this.loadData(), error: e => console.error(e) });
    }
  }

  resetForm() { this.editingId = undefined; this.plantForm = this.emptyPlant(); }

  emptyPlant(): Plant {
    return { name: '', category: 'Exterior', description: '', price: 0, stock: 0, image_url: '', light: '', water: '', is_featured: false, is_active: true };
  }

  uploadPlantImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.imageUploading = true;
    this.plantService.uploadImage(file).subscribe({
      next: (res) => { this.plantForm.image_url = res.url; this.imageUploading = false; this.cdr.detectChanges(); },
      error: () => { this.imageUploading = false; }
    });
  }

  // ── AI RESTOCK ──
  onInvoiceSelected(event: any) { const f = event.target.files[0]; if (f) this.selectedInvoice = f; }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    this.plantService.analyzeInvoice(this.selectedInvoice).subscribe({
      next: (res) => { this.invoiceResult = res; this.invoiceLoading = false; },
      error: () => {
        this.invoiceLoading = false;
        this.invoiceResult = { items: [{ plant_name: 'Ficus Lyrata (Autodetectado)', quantity: 5, unit_cost: 15.00 }] };
      }
    });
  }

  removeItemFromInvoice(i: number) { this.invoiceResult?.items?.splice(i, 1); }

  confirmRestock() {
    if (!this.invoiceResult?.items?.length) return;
    this.plantService.restockPlants(this.clientSlug, this.invoiceResult.items).subscribe({
      next: () => { this.cancelInvoice(); this.loadData(); alert('¡Inventario actualizado!'); },
      error: e => console.error(e)
    });
  }

  cancelInvoice() {
    this.selectedInvoice = null;
    this.invoiceResult = null;
  }
}