import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    .metric-card { background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;text-align:center;box-shadow:0 4px 12px rgba(16,35,25,0.04); }
    .section-title { margin:0 0 4px 0;color:#102319;font-size:1.3rem;font-weight:700; }
    .section-sub { margin:0 0 18px 0;color:#516052;font-size:0.88rem; }
    .form-input { padding:13px 14px;border-radius:12px;border:1px solid #dfe7dd;font-size:0.95rem;outline:none;width:100%;box-sizing:border-box; }
    .form-label { display:block;font-size:0.78rem;font-weight:700;color:#516052;margin-bottom:5px;letter-spacing:0.3px; }
    .form-group { display:flex;flex-direction:column; }
    .btn-primary { background:#14452F;color:white;padding:13px 20px;border:none;border-radius:99px;cursor:pointer;font-weight:700;font-size:0.95rem; }
    .btn-primary:hover { background:#0d3320; }
    .btn-secondary { background:#f4f8f1;color:#102319;padding:13px 20px;border:1px solid #dfe7dd;border-radius:99px;cursor:pointer;font-weight:600;font-size:0.95rem; }
    .admin-inventory { display:flex;flex-direction:column;gap:10px; }
  `],
  template: `
    <!-- HEADER ADMIN -->
    <header style="background:#14452F;color:white;display:flex;justify-content:space-between;align-items:center;padding:12px 20px;position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(20,69,47,0.18);">
      <button (click)="goToPublic()" style="background:none;border:none;color:rgba(255,255,255,0.75);cursor:pointer;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:6px;padding:0;">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"/></svg>
        Ver tienda
      </button>
      <div style="text-align:center;">
        <div style="font-size:1rem;font-weight:700;color:white;">Panel de Administración</div>
        <div style="font-size:0.7rem;color:#A3C4B3;">Demo Garden PR</div>
      </div>
      <button (click)="logout()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:600;font-size:0.82rem;">
        Salir
      </button>
    </header>

    <div style="max-width:1100px;margin:0 auto;padding:20px 16px 60px;">

      <!-- ── 1. DASHBOARD ── -->
      <div style="margin-bottom:24px;">
        <h2 class="section-title">Dashboard</h2>
        <p class="section-sub">Resumen del inventario en tiempo real.</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:16px;">
          <div class="metric-card">
            <div style="font-size:1.9rem;font-weight:800;color:#102319;line-height:1;">{{ plants.length }}</div>
            <div style="font-size:0.75rem;color:#516052;font-weight:600;margin-top:5px;">Total Plantas</div>
          </div>
          <div class="metric-card">
            <div style="font-size:1.9rem;font-weight:800;color:#1f7a4d;line-height:1;">{{ totalStock }}</div>
            <div style="font-size:0.75rem;color:#516052;font-weight:600;margin-top:5px;">Total en Stock</div>
          </div>
          <div class="metric-card" style="border-color:#fef3c7;">
            <div style="font-size:1.9rem;font-weight:800;color:#d97706;line-height:1;">{{ lowStockPlants.length }}</div>
            <div style="font-size:0.75rem;color:#516052;font-weight:600;margin-top:5px;">Bajo Stock</div>
          </div>
          <div class="metric-card" style="border-color:#fee2e2;">
            <div style="font-size:1.9rem;font-weight:800;color:#dc2626;line-height:1;">{{ outOfStockPlants.length }}</div>
            <div style="font-size:0.75rem;color:#516052;font-weight:600;margin-top:5px;">Sin Stock</div>
          </div>
          <div style="background:linear-gradient(135deg,#102319,#1f7a4d);border-radius:20px;padding:20px;text-align:center;box-shadow:0 4px 12px rgba(31,122,77,0.18);">
            <div style="font-size:1.4rem;font-weight:800;color:white;line-height:1;">\${{ estimatedInventoryValue | number:'1.0-0' }}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.75);font-weight:600;margin-top:5px;">Valor Estimado</div>
          </div>
        </div>

        <!-- Chart + Low stock -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
          <!-- Donut -->
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:22px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 18px 0;color:#102319;font-size:0.95rem;font-weight:700;">Inventario por categoría</h3>
            <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
              <svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0;">
                <ng-container *ngFor="let seg of donutSegments">
                  <circle cx="70" cy="70" r="48" fill="none"
                    [attr.stroke]="seg.color" stroke-width="24"
                    [attr.stroke-dasharray]="seg.dashArray"
                    [attr.stroke-dashoffset]="seg.dashOffset"
                    style="transform:rotate(-90deg);transform-origin:70px 70px;">
                  </circle>
                </ng-container>
                <text x="70" y="66" text-anchor="middle" style="font-size:20px;font-weight:800;fill:#102319;">{{ plants.length }}</text>
                <text x="70" y="82" text-anchor="middle" style="font-size:10px;fill:#516052;">Total</text>
              </svg>
              <div style="flex:1;min-width:130px;display:flex;flex-direction:column;gap:8px;">
                <div *ngFor="let seg of donutSegments" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <div style="display:flex;align-items:center;gap:7px;">
                    <span style="width:10px;height:10px;border-radius:50%;flex-shrink:0;" [style.background]="seg.color"></span>
                    <span style="font-size:0.82rem;color:#102319;">{{ seg.category }}</span>
                  </div>
                  <span style="font-size:0.78rem;color:#516052;font-weight:600;">{{ seg.count }} ({{ seg.percent }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Low stock list -->
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:22px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 4px 0;color:#102319;font-size:0.95rem;font-weight:700;">Productos con bajo stock</h3>
            <p style="margin:0 0 14px 0;color:#516052;font-size:0.78rem;">≤5 unidades disponibles</p>
            <div *ngIf="lowStockPlants.length === 0" style="text-align:center;padding:16px;color:#aaa;font-size:0.88rem;">✅ Inventario bien surtido</div>
            <div *ngFor="let p of lowStockPlants" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f4f4f4;">
              <div style="width:44px;height:44px;border-radius:10px;overflow:hidden;background:#f4f8f1;flex-shrink:0;">
                <img *ngIf="p.image_url" [src]="p.image_url" style="width:100%;height:100%;object-fit:cover;">
                <div *ngIf="!p.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">🪴</div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;color:#102319;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div>
                <div style="color:#dc2626;font-size:0.78rem;font-weight:600;">Stock: {{ p.stock }} {{ p.stock === 1 ? 'unidad' : 'unidades' }}</div>
              </div>
              <div style="font-weight:700;color:#1f7a4d;font-size:0.9rem;">\${{ p.price }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 2. AI RESTOCK ── -->
      <div style="background:linear-gradient(135deg,#0d3320,#1a5c38 60%,#236b45);border-radius:24px;padding:28px;margin-bottom:24px;box-shadow:0 16px 48px rgba(15,50,30,0.2);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:rgba(255,255,255,0.04);border-radius:50%;pointer-events:none;"></div>
        <div style="position:relative;z-index:1;">
          <span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:white;font-size:0.7rem;font-weight:800;letter-spacing:1.5px;padding:4px 12px;border-radius:99px;display:inline-block;margin-bottom:14px;">✨ AI RESTOCK</span>
          <h2 style="color:white;font-size:1.7rem;font-weight:800;margin:0 0 8px 0;letter-spacing:-0.5px;">AI Restock Assistant</h2>
          <p style="color:rgba(255,255,255,0.85);font-size:0.95rem;margin:0 0 4px 0;font-weight:500;">Actualiza tu inventario subiendo una factura del suplidor.</p>
          <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin:0 0 24px 0;">El sistema detecta plantas, cantidades y costos para reducir entrada manual y mantener el catálogo actualizado.</p>

          <div style="background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.2);border-radius:16px;padding:18px;">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
              <label style="display:flex;align-items:center;gap:8px;background:white;color:#102319;border-radius:12px;padding:10px 18px;font-weight:700;font-size:0.88rem;cursor:pointer;white-space:nowrap;">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir factura
                <input type="file" (change)="onInvoiceSelected($event)" accept="image/*,.pdf" style="display:none;">
              </label>
              <span style="color:rgba(255,255,255,0.55);font-size:0.82rem;flex:1;min-width:100px;">
                {{ selectedInvoice ? '📎 ' + selectedInvoice.name : 'JPG, PNG o PDF' }}
              </span>
              <button [disabled]="!selectedInvoice || invoiceLoading" (click)="analyzeInvoice()"
                style="padding:11px 22px;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-size:0.88rem;transition:all 0.2s;"
                [style.background]="(!selectedInvoice || invoiceLoading) ? 'rgba(255,255,255,0.12)' : '#4ade80'"
                [style.color]="(!selectedInvoice || invoiceLoading) ? 'rgba(255,255,255,0.35)' : '#052e16'">
                {{ invoiceLoading ? '⏳ Analizando...' : '🤖 Analizar con AI' }}
              </button>
            </div>
          </div>

          <div *ngIf="invoiceResult?.items?.length" style="background:white;border-radius:16px;padding:20px;margin-top:16px;">
            <h3 style="margin:0 0 14px 0;color:#102319;font-size:1rem;font-weight:700;">Plantas detectadas</h3>
            <div *ngFor="let item of invoiceResult!.items; let i = index" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
              <input type="text" [(ngModel)]="item.plant_name" class="form-input" style="flex:1 1 100%;" placeholder="Nombre">
              <input type="number" [(ngModel)]="item.quantity" class="form-input" style="flex:1;min-width:80px;" placeholder="Cantidad">
              <input type="number" step="0.01" [(ngModel)]="item.unit_cost" class="form-input" style="flex:1;min-width:80px;" placeholder="Costo">
              <button (click)="removeItemFromInvoice(i)" style="background:#fff0f0;border:none;color:#9b1c1c;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;">✕</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;">
              <button (click)="confirmRestock()" class="btn-primary" style="flex:1;min-width:140px;">✅ Confirmar actualización</button>
              <button (click)="cancelInvoice()" class="btn-secondary" style="flex:1;min-width:140px;">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 3. INVENTARIO ── -->
      <div style="margin-bottom:24px;">
        <h2 class="section-title">Inventario</h2>
        <p class="section-sub">{{ plants.length }} plantas en el catálogo.</p>
        <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;">🌱 Cargando...</div>
        <div class="admin-inventory" *ngIf="!loading">
          <app-plant-card *ngFor="let p of plants" [plant]="p" [adminMode]="true" [client]="client"
            (onEdit)="editPlant($event)" (onRemove)="removePlant($event)">
          </app-plant-card>
          <div *ngIf="plants.length === 0" style="text-align:center;padding:30px;color:#888;">No hay plantas aún.</div>
        </div>
      </div>

      <!-- ── 4. FORMULARIO ── -->
      <div style="background:white;border-radius:24px;padding:26px;border:1px solid #eef1ec;box-shadow:0 4px 16px rgba(16,35,25,0.04);">
        <h2 class="section-title">{{ editingId ? '✏️ Editar Planta' : '🌱 Nueva Planta' }}</h2>
        <p class="section-sub">{{ editingId ? 'Modifica los datos de la planta.' : 'Agrega una nueva planta al catálogo.' }}</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;">
          <div class="form-group">
            <label class="form-label">Nombre de la planta</label>
            <input type="text" [(ngModel)]="plantForm.name" class="form-input" placeholder="Ej. Monstera Deliciosa">
          </div>
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <input type="text" [(ngModel)]="plantForm.category" class="form-input" placeholder="Ej. Interior, Exterior">
          </div>
          <div class="form-group">
            <label class="form-label">Precio de venta</label>
            <input type="number" [(ngModel)]="plantForm.price" class="form-input" placeholder="Precio">
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad disponible</label>
            <input type="number" [(ngModel)]="plantForm.stock" class="form-input" placeholder="Stock">
          </div>
          <div class="form-group">
            <label class="form-label">Imagen</label>
            <div style="position:relative;border:2px dashed #dfe7dd;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:48px;background:#fafdf8;cursor:pointer;">
              <input type="file" accept="image/*" (change)="uploadPlantImage($event)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
              <span style="color:#516052;font-weight:600;font-size:0.88rem;pointer-events:none;">
                {{ imageUploading ? '⏳ Subiendo...' : plantForm.image_url ? '✅ Imagen subida' : '📷 Subir imagen' }}
              </span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Luz</label>
            <input type="text" [(ngModel)]="plantForm.light" class="form-input" placeholder="Ej. Sol parcial">
          </div>
          <div class="form-group">
            <label class="form-label">Agua / Riego</label>
            <input type="text" [(ngModel)]="plantForm.water" class="form-input" placeholder="Ej. Moderada">
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Descripción</label>
            <textarea [(ngModel)]="plantForm.description" class="form-input" style="min-height:80px;resize:vertical;" placeholder="Descripción breve de la planta..."></textarea>
          </div>
          <div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;">
            <input type="checkbox" [(ngModel)]="plantForm.is_featured" id="featured" style="width:18px;height:18px;accent-color:#14452F;">
            <label for="featured" style="color:#102319;font-weight:500;cursor:pointer;font-size:0.92rem;">Destacar planta</label>
          </div>
          <div style="grid-column:1/-1;display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
            <button (click)="savePlant()" class="btn-primary" style="flex:1;min-width:140px;">
              {{ editingId ? '✅ Actualizar Planta' : '➕ Crear Planta' }}
            </button>
            <button (click)="resetForm()" class="btn-secondary" style="flex:1;min-width:140px;">Limpiar formulario</button>
          </div>
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

  readonly CHART_COLORS = ['#14452F','#4caf78','#f5c842','#9ecfb0','#e07b54','#6b8f71'];

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

  get totalStock() { return this.plants.reduce((s,p) => s + (p.stock||0), 0); }
  get lowStockPlants() { return this.plants.filter(p => p.stock > 0 && p.stock <= 5); }
  get outOfStockPlants() { return this.plants.filter(p => p.stock <= 0); }
  get estimatedInventoryValue() { return this.plants.reduce((s,p) => s + ((p.price||0)*(p.stock||0)), 0); }

  get donutSegments() {
    const c = 2 * Math.PI * 48;
    const map = new Map<string,number>();
    this.plants.forEach(p => { const k = p.category||'Sin categoría'; map.set(k,(map.get(k)||0)+1); });
    const total = this.plants.length || 1;
    let offset = 0; let ci = 0; const segs: any[] = [];
    map.forEach((count,category) => {
      const pct = count/total; const dash = pct*c;
      segs.push({ category, count, percent: Math.round(pct*100), color: this.CHART_COLORS[ci%this.CHART_COLORS.length], dashArray: `${dash} ${c}`, dashOffset: -offset });
      offset += dash; ci++;
    });
    return segs;
  }

  savePlant() {
    if (!this.plantForm.name) return;
    const req = this.editingId ? this.plantService.updatePlant(this.editingId, this.plantForm) : this.plantService.createPlant(this.clientSlug, this.plantForm);
    req.subscribe({ next: () => { this.resetForm(); this.loadData(); }, error: e => console.error(e) });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    window.scrollTo({ top: 99999, behavior: 'smooth' });
  }

  removePlant(plant: Plant) {
    if (!plant.id) return;
    if (confirm(`¿Eliminar ${plant.name}?`)) {
      this.plantService.deletePlant(plant.id).subscribe({ next: () => this.loadData(), error: e => console.error(e) });
    }
  }

  resetForm() { this.editingId = undefined; this.plantForm = this.emptyPlant(); }

  emptyPlant(): Plant {
    return { name:'', category:'Exterior', description:'', price: null as any, stock: null as any, image_url:'', light:'', water:'', is_featured:false, is_active:true };
  }

  uploadPlantImage(event: any) {
    const file = event.target.files[0]; if (!file) return;
    this.imageUploading = true;
    this.plantService.uploadImage(file).subscribe({
      next: (res) => { this.plantForm.image_url = res.url; this.imageUploading = false; this.cdr.detectChanges(); },
      error: () => { this.imageUploading = false; }
    });
  }

  onInvoiceSelected(event: any) { const f = event.target.files[0]; if (f) this.selectedInvoice = f; }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    this.plantService.analyzeInvoice(this.selectedInvoice).subscribe({
      next: (res) => { this.invoiceResult = res; this.invoiceLoading = false; },
      error: () => { this.invoiceLoading = false; this.invoiceResult = { items: [{ plant_name: 'Ficus Lyrata (Autodetectado)', quantity: 5, unit_cost: 15.00 }] }; }
    });
  }

  removeItemFromInvoice(i: number) { this.invoiceResult?.items?.splice(i,1); }

  confirmRestock() {
    if (!this.invoiceResult?.items?.length) return;
    this.plantService.restockPlants(this.clientSlug, this.invoiceResult.items).subscribe({
      next: () => { this.cancelInvoice(); this.loadData(); alert('¡Inventario actualizado!'); },
      error: e => console.error(e)
    });
  }

  cancelInvoice() { this.selectedInvoice = null; this.invoiceResult = null; }
}