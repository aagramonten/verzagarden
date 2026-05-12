import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant, SalesReport } from '../services/plant.service';
import { PlantCardComponent } from '../plant-card.component';

export const PLANT_CATEGORIES = [
  'Árboles', 'Arbustos', 'Flores de estación', 'Plantas de interior',
  'Trepadoras', 'Suculentas', 'Palmas',
  'Tiestos y Macetas', 'Tierra y Sustratos', 'Fertilizantes y Abonos', 'Herramientas',
];

export const CATEGORY_GROUPS = [
  { label: 'Plantas', items: ['Árboles', 'Arbustos', 'Flores de estación', 'Plantas de interior', 'Trepadoras', 'Suculentas', 'Palmas'] },
  { label: 'Productos de jardín', items: ['Tiestos y Macetas', 'Tierra y Sustratos', 'Fertilizantes y Abonos', 'Herramientas'] },
];

const CHART_COLORS = ['#10B981','#34D399','#6EE7B7','#059669','#047857','#14452F','#f5c842','#38bdf8','#8B5E3C'];

interface RestockItem {
  plant_name: string; category: string; quantity: number; unit_cost: number;
  total_cost: number; current_sale_price: number | null; row_margin: number; apply_suggested_price: boolean;
}

declare const lucide: any;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent],
  styles: [`
    :host { --sidebar-bg: #0A5C36; --sidebar-hover: #0E794A; --bg: #F4F7F6; --text-main: #111827; --text-muted: #6B7280; --border: #E5E7EB; }
    * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
    
    .layout { display: flex; min-height: 100vh; background: var(--bg); }
    
    .sidebar { width: 260px; background: var(--sidebar-bg); color: white; display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; }
    .brand { padding: 30px 24px; display: flex; align-items: center; gap: 12px; }
    .brand-icon { font-size: 24px; }
    .brand-text { display: flex; flex-direction: column; }
    .brand-title { font-weight: 700; font-size: 1.1rem; line-height: 1.2; }
    .brand-sub { font-size: 0.75rem; opacity: 0.7; }
    
    .nav-menu { padding: 0 16px; flex: 1; display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; color: rgba(255,255,255,0.7); cursor: pointer; border: none; background: transparent; font-size: 0.95rem; font-weight: 500; text-align: left; transition: all 0.2s; width: 100%; }
    .nav-item:hover { background: var(--sidebar-hover); color: white; }
    .nav-item.active { background: var(--sidebar-hover); color: white; font-weight: 600; border-left: 4px solid #10B981; }
    .nav-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 16px 0; }
    .sidebar-footer { padding: 24px; font-size: 0.75rem; opacity: 0.6; display: flex; justify-content: space-between; align-items: center; }
    
    .main { flex: 1; margin-left: 260px; padding: 40px; overflow-x: hidden; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 12px; margin: 0; }
    .header-actions { display: flex; gap: 12px; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid var(--border); }
    .metric-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .metric-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .metric-val { font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
    .metric-lab { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    
    .chart-box { min-height: 300px; margin-bottom: 30px; }
    .chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .chart-title { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
    
    .btn-primary { background: #10B981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; transition: background 0.2s; }
    .btn-primary:hover { background: #059669; }
    .btn-outline { background: white; color: var(--text-main); border: 1px solid var(--border); padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; transition: background 0.2s; }
    .btn-outline:hover { background: #F9FAFB; }
    
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .form-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border); font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
    .form-input:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    
    .table-container { overflow-x: auto; background: white; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F9FAFB; padding: 14px 24px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border); }
    td { padding: 16px 24px; border-bottom: 1px solid var(--border); font-size: 0.9rem; color: var(--text-main); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    
    .admin-inventory { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 20px; }
    .period-pill { padding:6px 14px; border-radius:99px; font-size:0.8rem; font-weight:600; cursor:pointer; border:1px solid var(--border); background:white; color:var(--text-muted); transition:all 0.15s; }
    .period-pill.active { background:#10B981; color:white; border-color:#10B981; }
    
    @media (max-width: 768px) {
      .sidebar { width: 70px; }
      .brand-text, .nav-item span { display: none; }
      .main { margin-left: 70px; padding: 20px; }
      .nav-item { justify-content: center; padding: 14px 0; }
    }
  `],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <i data-lucide="leaf" class="brand-icon"></i>
          <div class="brand-text">
            <span class="brand-title">Jardín Esmeralda</span>
            <span class="brand-sub">Sistema de Gestión</span>
          </div>
        </div>
        
        <nav class="nav-menu">
          <button class="nav-item" [class.active]="activeTab==='dashboard'" (click)="setTab('dashboard')">
            <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
          </button>
          <button class="nav-item" [class.active]="activeTab==='inventario'" (click)="setTab('inventario')">
            <i data-lucide="package"></i> <span>Inventario</span>
          </button>
          <button class="nav-item" [class.active]="activeTab==='stock'" (click)="setTab('stock')">
            <i data-lucide="shopping-cart"></i> <span>Stock</span>
          </button>
          <button class="nav-item" [class.active]="activeTab==='ventas'" (click)="setTab('ventas')">
            <i data-lucide="trending-up"></i> <span>Ventas &amp; Ganancias</span>
          </button>
          
          <div class="nav-divider"></div>
          
          <button class="nav-item" [class.active]="activeTab==='pos'" (click)="setTab('pos')">
            <i data-lucide="upload-cloud"></i> <span>Importar POS</span>
          </button>
          <button class="nav-item" [class.active]="activeTab==='ajustes'" (click)="setTab('ajustes')">
            <i data-lucide="settings"></i> <span>Ajustes</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <span>© 2026 Jardín Esmeralda</span>
          <button (click)="logout()" style="background:none; border:none; color:white; cursor:pointer;" title="Cerrar Sesión">
            <i data-lucide="log-out" style="width:16px;"></i>
          </button>
        </div>
      </aside>

      <main class="main">
        <header class="page-header">
          <h1 class="page-title">
            <button *ngIf="activeTab!=='dashboard'" (click)="setTab('dashboard')" style="background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center;">
              <i data-lucide="arrow-left" style="margin-right:10px;"></i>
            </button>
            {{ getTabTitle() }}
          </h1>
          <div class="header-actions">
            <button class="btn-outline" (click)="goToPublic()"><i data-lucide="external-link"></i> Ver Tienda</button>
            <button *ngIf="activeTab==='inventario'" class="btn-primary" (click)="showForm = !showForm">
              <i [attr.data-lucide]="showForm ? 'x' : 'plus'"></i> {{ showForm ? 'Cerrar' : 'Agregar Producto' }}
            </button>
            <button *ngIf="activeTab==='ventas'" class="btn-primary"><i data-lucide="download"></i> Exportar</button>
          </div>
        </header>

        <!-- DASHBOARD -->
        <div *ngIf="activeTab==='dashboard'">
          <div class="metrics-grid">
            <div class="card" (click)="setTab('ventas')" style="cursor:pointer;">
              <div class="metric-top">
                <div class="metric-icon" style="background:#ECFDF5; color:#10B981;"><i data-lucide="dollar-sign"></i></div>
              </div>
              <div class="metric-val">\${{ estimatedInventoryValue | number:'1.0-0' }}</div>
              <div class="metric-lab">Valor Total Inventario</div>
            </div>
            <div class="card" (click)="setTab('ventas')" style="cursor:pointer;">
              <div class="metric-top">
                <div class="metric-icon" style="background:#EFF6FF; color:#3B82F6;"><i data-lucide="trending-up"></i></div>
              </div>
              <div class="metric-val">\${{ (salesReport?.summary?.total_profit || 0) | number:'1.0-0' }}</div>
              <div class="metric-lab">Ganancia del Mes</div>
            </div>
            <div class="card" (click)="setTab('inventario')" style="cursor:pointer;">
              <div class="metric-top">
                <div class="metric-icon" style="background:#F3F4F6; color:#6B7280;"><i data-lucide="package"></i></div>
              </div>
              <div class="metric-val">{{ plants.length }}</div>
              <div class="metric-lab">Productos en Catálogo</div>
            </div>
            <div class="card" (click)="setTab('stock')" style="cursor:pointer; border-bottom: 4px solid #F59E0B;">
              <div class="metric-top">
                <div class="metric-icon" style="background:#FEF3C7; color:#F59E0B;"><i data-lucide="alert-circle"></i></div>
              </div>
              <div class="metric-val">{{ lowStockPlants.length + outOfStockPlants.length }}</div>
              <div class="metric-lab">Alertas de Stock</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
            <div class="card chart-box">
              <div class="chart-head"><span class="chart-title">Ventas vs Ganancias (14 días)</span></div>
              <div style="height: 250px; display:flex; align-items:flex-end; gap:8px; overflow-x:auto;">
                 <div *ngFor="let d of salesReport?.chart_data" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;flex:1;min-width:40px;height:100%;">
                    <div [style.height.px]="getBarPxRevenue(d.revenue)" style="width:100%;background:rgba(16,185,129,0.2);border-radius:6px 6px 0 0; position:relative;">
                      <div [style.height.px]="getBarPxUnits(d.units)" style="position:absolute; bottom:0; width:100%; background:#10B981; border-radius:6px 6px 0 0;"></div>
                    </div>
                    <div style="font-size:0.65rem;color:var(--text-muted);">{{ formatChartDay(d.day) }}</div>
                 </div>
              </div>
            </div>
            <div class="card chart-box">
              <div class="chart-head"><span class="chart-title">Distribución por Categoría</span></div>
              <div style="display:flex; justify-content:center; margin-top:20px;">
                <svg width="150" height="150" viewBox="0 0 130 130">
                  <ng-container *ngFor="let seg of donutSegments">
                    <circle cx="65" cy="65" r="44" fill="none" [attr.stroke]="seg.color" stroke-width="22" [attr.stroke-dasharray]="seg.dashArray" [attr.stroke-dashoffset]="seg.dashOffset" style="transform:rotate(-90deg);transform-origin:65px 65px;"></circle>
                  </ng-container>
                  <text x="65" y="70" text-anchor="middle" style="font-size:20px;font-weight:800;fill:var(--text-main);">{{ plants.length }}</text>
                </svg>
              </div>
              <div style="margin-top:20px;">
                <div *ngFor="let seg of donutSegments | slice:0:3" style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px;">
                  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:50%;" [style.background]="seg.color"></span>{{ seg.category }}</span>
                  <span style="font-weight:600;">{{ seg.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INVENTARIO -->
        <div *ngIf="activeTab==='inventario'">
          <div *ngIf="showForm" class="card" style="margin-bottom:24px;">
            <h3 style="margin:0 0 20px; font-size:1.2rem;">{{ editingId ? 'Editar Producto' : 'Crear Nuevo Producto' }}</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
              <div class="form-group"><label class="form-label">Nombre</label><input type="text" [(ngModel)]="plantForm.name" class="form-input"></div>
              <div class="form-group">
                <label class="form-label">Categoría</label>
                <select [(ngModel)]="plantForm.category" class="form-input">
                  <optgroup *ngFor="let group of CATEGORY_GROUPS" [label]="group.label">
                    <option *ngFor="let cat of group.items" [value]="cat">{{ cat }}</option>
                  </optgroup>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Precio de Venta ($)</label><input type="number" [(ngModel)]="plantForm.price" class="form-input"></div>
              <div class="form-group"><label class="form-label">Costo de Compra ($)</label><input type="number" [(ngModel)]="plantForm.cost_price" class="form-input"></div>
              <div class="form-group"><label class="form-label">Stock Inicial</label><input type="number" [(ngModel)]="plantForm.stock" class="form-input"></div>
              <div class="form-group">
                <label class="form-label">Imagen</label>
                <label style="display:flex; align-items:center; gap:8px; background:white; border:1px solid var(--border); border-radius:10px; padding:10px 14px; cursor:pointer; transition:border-color 0.2s; font-size:0.9rem; font-weight:600; color:var(--text-main);" 
                  [style.border-color]="plantForm.image_url ? '#10B981' : 'var(--border)'">
                  <i [attr.data-lucide]="imageUploading ? 'loader-2' : plantForm.image_url ? 'check-circle' : 'upload'" 
                    [style.color]="plantForm.image_url ? '#10B981' : 'var(--text-muted)'"
                    style="width:18px;height:18px;flex-shrink:0;"></i>
                  <span [style.color]="plantForm.image_url ? '#10B981' : 'var(--text-muted)'">
                    {{ imageUploading ? 'Subiendo...' : plantForm.image_url ? 'Foto cargada ✓' : 'Subir foto' }}
                  </span>
                  <input type="file" (change)="uploadPlantImage($event)" accept="image/*" style="display:none;">
                </label>
                <div *ngIf="plantForm.image_url && !imageUploading" style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                  <img [src]="plantForm.image_url" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
                  <button type="button" (click)="plantForm.image_url = ''" style="background:none; border:none; color:#9b1c1c; cursor:pointer; font-size:0.8rem; font-weight:600;">Quitar</button>
                </div>
              </div>
              <div class="form-group" style="grid-column: 1 / -1;"><label class="form-label">Descripción</label><textarea [(ngModel)]="plantForm.description" class="form-input" style="min-height:80px;"></textarea></div>
            </div>
            <div style="display:flex; gap:12px; margin-top:10px;">
              <button class="btn-primary" (click)="savePlant()">{{ editingId ? 'Actualizar' : 'Guardar' }}</button>
              <button class="btn-outline" (click)="resetForm(); showForm=false;">Cancelar</button>
            </div>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:16px;">
            <button class="period-pill" [class.active]="inventoryFilter==='all'" (click)="inventoryFilter='all'">Todos</button>
            <button class="period-pill" [class.active]="inventoryFilter==='low'" (click)="inventoryFilter='low'">Bajo Stock</button>
            <button class="period-pill" [class.active]="inventoryFilter==='out'" (click)="inventoryFilter='out'">Agotados</button>
          </div>

          <div *ngIf="loading" style="text-align:center; padding:40px;">Cargando...</div>
          <div class="admin-inventory" *ngIf="!loading">
            <app-plant-card *ngFor="let p of filteredInventory" [plant]="p" [adminMode]="true" [client]="client" (onEdit)="editPlant($event)" (onRemove)="removePlant($event)"></app-plant-card>
          </div>
        </div>

        <!-- STOCK -->
        <div *ngIf="activeTab==='stock'">
          <div class="metrics-grid">
             <div class="card" style="border-left: 5px solid #EF4444;">
                <div class="metric-val" style="color:#EF4444;">{{ outOfStockPlants.length }}</div>
                <div class="metric-lab">Stock Crítico (Agotados)</div>
             </div>
             <div class="card" style="border-left: 5px solid #F59E0B;">
                <div class="metric-val" style="color:#F59E0B;">{{ lowStockPlants.length }}</div>
                <div class="metric-lab">Stock Bajo (≤ 5)</div>
             </div>
          </div>

          <div class="card" style="background:#FEF2F2; border-color:#FCA5A5; margin-bottom:30px;" *ngIf="outOfStockPlants.length > 0">
             <h3 style="color:#991B1B; margin:0 0 8px; display:flex; align-items:center; gap:8px;"><i data-lucide="alert-triangle"></i> Alerta de Stock Crítico</h3>
             <p style="color:#7F1D1D; font-size:0.9rem; margin:0;">Los siguientes productos necesitan reabastecimiento urgente: 
               <strong>{{ getOutOfStockNames() }}</strong>.
             </p>
          </div>

          <div class="card" style="margin-bottom:30px; background:linear-gradient(to right, #0A5C36, #10B981); color:white; border:none;">
            <h3 style="margin:0 0 8px; display:flex; align-items:center; gap:8px;"><i data-lucide="sparkles"></i> Actualizar con Factura (IA)</h3>
            <p style="font-size:0.9rem; opacity:0.9; margin-bottom:16px;">Sube la factura de tu proveedor y la Inteligencia Artificial actualizará cantidades y costos automáticamente.</p>
            <div style="display:flex; gap:16px; align-items:center;">
              <label class="btn-outline" style="background:rgba(255,255,255,0.2); border:none; color:white;">
                <i data-lucide="upload"></i> Subir PDF/Imagen
                <input type="file" (change)="onInvoiceSelected($event)" accept="image/*,.pdf" style="display:none;">
              </label>
              <span *ngIf="selectedInvoice">{{ selectedInvoice.name }}</span>
              <button *ngIf="selectedInvoice" class="btn-primary" style="background:white; color:#0A5C36;" (click)="analyzeInvoice()" [disabled]="invoiceLoading">
                {{ invoiceLoading ? 'Analizando...' : 'Procesar Factura' }}
              </button>
            </div>
          </div>

          <div class="table-container" *ngIf="restockItems.length" style="margin-bottom:30px;">
            <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:1.1rem;">Productos Detectados</h3>
              <div style="display:flex; gap:10px;">
                <button class="btn-outline" (click)="cancelInvoice()">Cancelar</button>
                <button class="btn-primary" (click)="confirmRestock()">Confirmar Ingreso</button>
              </div>
            </div>
            <table>
              <thead><tr><th>Producto</th><th>Cant.</th><th>Costo Unit.</th><th>Precio Sugerido</th><th>Confirmar</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of restockItems; let i = index">
                  <td><input type="text" [(ngModel)]="item.plant_name" class="form-input" style="padding:6px; height:auto;"></td>
                  <td><input type="number" [(ngModel)]="item.quantity" class="form-input" style="padding:6px; width:70px; height:auto;"></td>
                  <td><input type="number" [(ngModel)]="item.unit_cost" class="form-input" style="padding:6px; width:90px; height:auto;"></td>
                  <td>
                    <div style="font-weight:700; color:#10B981;">\${{ getRowSuggestedPrice(item) | number:'1.2-2' }}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">Margen: {{ item.row_margin }}%</div>
                  </td>
                  <td><input type="checkbox" [(ngModel)]="item.apply_suggested_price" style="width:18px;height:18px;accent-color:#10B981;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-container">
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Stock Actual</th><th>Estado</th></tr></thead>
              <tbody>
                <tr *ngFor="let p of plants">
                  <td style="font-weight:600;">{{ p.name }}</td>
                  <td>{{ p.category }}</td>
                  <td style="font-weight:700;">{{ p.stock }}</td>
                  <td>
                    <span class="status-pill" [style.background]="p.stock > 5 ? '#D1FAE5' : (p.stock > 0 ? '#FEF3C7' : '#FEE2E2')" [style.color]="p.stock > 5 ? '#065F46' : (p.stock > 0 ? '#92400E' : '#991B1B')">
                      {{ p.stock > 5 ? 'Ok' : (p.stock > 0 ? 'Bajo' : 'Agotado') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- VENTAS -->
        <div *ngIf="activeTab==='ventas'">
          <div style="display:flex; gap:8px; margin-bottom:24px;">
            <button *ngFor="let p of salesPeriods" class="period-pill" [class.active]="selectedSalesPeriod===p.value" (click)="changeSalesPeriod(p.value)">{{ p.label }}</button>
          </div>

          <div class="metrics-grid">
            <div class="card">
              <div class="metric-top"><div class="metric-icon" style="background:#ECFDF5; color:#10B981;"><i data-lucide="dollar-sign"></i></div></div>
              <div class="metric-val">\${{ salesReport?.summary?.total_revenue | number:'1.2-2' }}</div>
              <div class="metric-lab">Ventas Totales</div>
            </div>
            <div class="card">
              <div class="metric-top"><div class="metric-icon" style="background:#EFF6FF; color:#3B82F6;"><i data-lucide="trending-up"></i></div></div>
              <div class="metric-val">\${{ salesReport?.summary?.total_profit | number:'1.2-2' }}</div>
              <div class="metric-lab">Ganancia Total</div>
            </div>
            <div class="card">
              <div class="metric-top"><div class="metric-icon" style="background:#F5F3FF; color:#8B5CF6;"><i data-lucide="shopping-bag"></i></div></div>
              <div class="metric-val">{{ salesReport?.summary?.total_transactions }}</div>
              <div class="metric-lab">Transacciones</div>
            </div>
            <div class="card">
              <div class="metric-top"><div class="metric-icon" style="background:#FFF7ED; color:#F59E0B;"><i data-lucide="percent"></i></div></div>
              <div class="metric-val">{{ salesReport?.summary?.margin_pct | number:'1.0-1' }}%</div>
              <div class="metric-lab">Margen de Ganancia</div>
            </div>
          </div>

          <div class="table-container">
            <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
              <h3 style="margin:0; font-size:1.1rem;">Transacciones Recientes</h3>
            </div>
            <table>
              <thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Total</th><th>Ganancia</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of salesReport?.recent_imports">
                  <td style="color:var(--text-muted);">{{ item.imported_at | date:'yyyy-MM-dd' }}</td>
                  <td style="font-weight:600;">{{ item.plant_name }}</td>
                  <td>{{ item.qty_sold }}</td>
                  <td style="font-weight:700;">\${{ (item.qty_sold * item.price) | number:'1.2-2' }}</td>
                  <td style="font-weight:700; color:#10B981;">\${{ (item.qty_sold * (item.price - (item.cost_price || 0))) | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- POS -->
        <div *ngIf="activeTab==='pos'">
          <div class="card" style="text-align:center; padding:60px 20px;">
            <i data-lucide="upload-cloud" style="width:64px; height:64px; color:#10B981; margin-bottom:20px;"></i>
            <h2 style="margin:0 0 10px;">Importar Ventas desde POS</h2>
            <p style="color:var(--text-muted); margin-bottom:24px;">Sube el archivo Excel o CSV de tu sistema de ventas para descontar inventario automáticamente.</p>
            <label class="btn-primary" style="display:inline-flex; margin:0 auto;">
              <i data-lucide="file-up"></i> Seleccionar Archivo
              <input type="file" (change)="onPosFileSelected($event)" accept=".csv,.xlsx,.xls" style="display:none;">
            </label>
            <div *ngIf="posFile" style="margin-top:16px; font-weight:600;">{{ posFile.name }}</div>
            <button *ngIf="posFile" class="btn-outline" style="margin: 16px auto 0;" (click)="analyzePosFile()" [disabled]="posLoading">
              {{ posLoading ? 'Analizando...' : 'Analizar Ventas' }}
            </button>
          </div>
          
          <div *ngIf="posImportSuccessMsg" style="background:#ECFDF5; color:#065F46; padding:16px; border-radius:12px; margin-top:20px;">
            {{ posImportSuccessMsg }}
          </div>

          <div class="table-container" *ngIf="posItems.length" style="margin-top:30px;">
            <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0;">Resultados del POS</h3>
              <button class="btn-primary" (click)="confirmPosImport()">Confirmar Descuento</button>
            </div>
            <table>
              <thead><tr><th>Producto del POS</th><th>Cant.</th><th>Match Catálogo</th><th>Estado</th><th>Omitir</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of posItems">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.qty_sold }}</td>
                  <td>{{ item.matched_plant_name || '—' }}</td>
                  <td>
                    <span class="status-pill" [style.background]="getPosBadgeBg(item.status)" [style.color]="getPosBadgeColor(item.status)">
                      {{ getPosBadgeLabel(item.status) }}
                    </span>
                  </td>
                  <td><input type="checkbox" [(ngModel)]="item.skip" style="width:18px;height:18px;accent-color:#10B981;"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- AJUSTES -->
        <div *ngIf="activeTab==='ajustes'">
          <div class="card" style="max-width: 600px;">
            <h3 style="margin:0 0 20px; display:flex; align-items:center; gap:8px;"><i data-lucide="message-circle" style="color:#10B981;"></i> Mensaje Predefinido de WhatsApp</h3>
            <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:16px;">Usa las variables para que el sistema las reemplace automáticamente por la información del producto.</p>
            
            <!-- ✅ FIX: se usan entidades HTML para evitar error ICU de Angular con llaves { } -->
            <div style="display:flex; gap:8px; margin-bottom:16px;">
              <button class="btn-outline" style="padding:6px 12px; font-size:0.8rem;" (click)="insertVar(VAR_PLANTA)">&#123;planta&#125;</button>
              <button class="btn-outline" style="padding:6px 12px; font-size:0.8rem;" (click)="insertVar(VAR_PRECIO)">&#123;precio&#125;</button>
              <button class="btn-outline" style="padding:6px 12px; font-size:0.8rem;" (click)="insertVar(VAR_CATEGORIA)">&#123;categoria&#125;</button>
            </div>

            <textarea id="wa-message-input" [(ngModel)]="waMessage" class="form-input" style="min-height:120px; margin-bottom:16px;"></textarea>
            
            <div style="background:#F9FAFB; padding:16px; border-radius:10px; margin-bottom:20px; font-size:0.9rem;">
              <strong>Vista previa:</strong><br>
              <span style="color:var(--text-muted);">{{ getWaPreview() }}</span>
            </div>

            <div style="display:flex; gap:12px;">
              <button class="btn-primary" (click)="saveSettings()">{{ settingsSaving ? 'Guardando...' : 'Guardar Mensaje' }}</button>
              <button class="btn-outline" (click)="resetWaMessage()">Restaurar</button>
            </div>
            <div *ngIf="settingsSaved" style="color:#10B981; font-size:0.85rem; margin-top:10px; font-weight:600;">¡Ajustes guardados correctamente!</div>
          </div>
          
          <div class="card" style="max-width: 600px; margin-top:20px;">
            <h3 style="margin:0 0 16px;">Tu tienda pública</h3>
            <div style="display:flex; gap:10px;">
              <input type="text" [value]="storeUrl" class="form-input" readonly style="background:#F9FAFB; color:var(--text-muted);">
              <button class="btn-outline" (click)="copyStoreUrl()">{{ urlCopied ? 'Copiado' : 'Copiar' }}</button>
            </div>
          </div>
        </div>

      </main>
    </div>
  `
})
export class AdminComponent implements OnInit, AfterViewInit {
  readonly PLANT_CATEGORIES = PLANT_CATEGORIES;
  readonly CATEGORY_GROUPS = CATEGORY_GROUPS;

  // ✅ Variables como constantes del componente para evitar strings con llaves en template
  readonly VAR_PLANTA    = '{planta}';
  readonly VAR_PRECIO    = '{precio}';
  readonly VAR_CATEGORIA = '{categoria}';

  clientSlug = sessionStorage.getItem('admin_slug') || 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  loading = true;
  plantForm: Plant = this.emptyPlant();
  editingId?: number;
  imageUploading = false;
  showForm = false;

  activeTab: 'dashboard' | 'ventas' | 'inventario' | 'pos' | 'stock' | 'ajustes' = 'dashboard';
  inventoryFilter: 'all' | 'low' | 'out' = 'all';

  selectedInvoice: File | null = null;
  invoiceLoading = false;
  restockItems: RestockItem[] = [];
  desiredMargin = 50;

  posFile: File | null = null;
  posLoading = false;
  posError = '';
  posItems: any[] = [];
  posImportSuccessMsg = '';

  salesReport: SalesReport | null = null;
  salesLoading = false;
  selectedSalesPeriod = 'month';
  salesPeriods = [
    { label: 'Hoy',      value: 'today' },
    { label: '7 días',   value: 'week'  },
    { label: '30 días',  value: 'month' },
    { label: 'Este año', value: 'year'  },
    { label: 'Todo',     value: 'all'   },
  ];

  waMessage = '';
  settingsSaving = false;
  settingsSaved = false;
  urlCopied = false;
  readonly DEFAULT_WA_MESSAGE = 'Hola! Me interesa {planta} a {precio}. ¿Está disponible?';

  get storeUrl(): string { return `https://${this.clientSlug}.verzagarden.com`; }

  constructor(private plantService: PlantService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (sessionStorage.getItem('admin_slug') !== this.clientSlug) { this.router.navigate(['/']); return; }
    this.loadData();
    this.loadSalesReport(this.selectedSalesPeriod);
  }

  ngAfterViewInit() { this.renderIcons(); }

  renderIcons() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }

  setTab(tab: 'dashboard' | 'ventas' | 'inventario' | 'pos' | 'stock' | 'ajustes') {
    this.activeTab = tab;
    this.cdr.detectChanges();
    this.renderIcons();
  }

  getTabTitle() {
    const titles: any = {
      'dashboard': 'Dashboard',
      'inventario': 'Inventario',
      'stock': 'Stock',
      'ventas': 'Ventas & Ganancias',
      'pos': 'Importar POS',
      'ajustes': 'Ajustes'
    };
    return titles[this.activeTab];
  }

  goToInventory(filter: 'all' | 'low' | 'out') {
    this.inventoryFilter = filter;
    this.setTab('inventario');
  }

  get filteredInventory(): Plant[] {
    if (this.inventoryFilter === 'low') return this.lowStockPlants;
    if (this.inventoryFilter === 'out') return this.outOfStockPlants;
    return this.plants;
  }

  loadData() {
    this.plantService.getPlants(this.clientSlug).subscribe({
      next: plants => { this.plants = [...plants]; this.loading = false; this.cdr.detectChanges(); this.renderIcons(); },
      error: () => { this.loading = false; }
    });
    this.plantService.getClient(this.clientSlug).subscribe({
      next: client => {
        this.client = { ...client };
        this.waMessage = (client as any).whatsapp_message || this.DEFAULT_WA_MESSAGE;
        this.cdr.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  // ✅ Método helper para evitar .map() directo en template (causa error en algunos builds)
  getOutOfStockNames(): string {
    return this.outOfStockPlants.map(p => p.name).join(', ');
  }

  getWaPreview(): string {
    return this.waMessage
      .replace('{planta}', 'Monstera Deliciosa')
      .replace('{precio}', '$50.00')
      .replace('{categoria}', 'Plantas de interior');
  }

  insertVar(variable: string) {
    const el = document.getElementById('wa-message-input') as HTMLTextAreaElement;
    if (el) {
      const start = el.selectionStart ?? this.waMessage.length;
      const end = el.selectionEnd ?? this.waMessage.length;
      this.waMessage = this.waMessage.slice(0, start) + variable + this.waMessage.slice(end);
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    } else {
      this.waMessage += variable;
    }
  }

  resetWaMessage() { this.waMessage = this.DEFAULT_WA_MESSAGE; }

  saveSettings() {
    this.settingsSaving = true;
    this.plantService.updateClientSettings(this.clientSlug, this.waMessage).subscribe({
      next: () => {
        this.settingsSaving = false;
        this.settingsSaved = true;
        this.cdr.detectChanges();
        setTimeout(() => { this.settingsSaved = false; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { console.error(err); this.settingsSaving = false; this.cdr.detectChanges(); }
    });
  }

  copyStoreUrl() {
    navigator.clipboard.writeText(this.storeUrl).then(() => {
      this.urlCopied = true;
      this.cdr.detectChanges();
      setTimeout(() => { this.urlCopied = false; this.cdr.detectChanges(); }, 2000);
    });
  }

  loadSalesReport(period: string) {
    this.salesLoading = true;
    this.salesReport = null;
    this.plantService.getSalesReport(this.clientSlug, period).subscribe({
      next: (report) => { this.salesReport = report; this.salesLoading = false; this.cdr.detectChanges(); this.renderIcons(); },
      error: (err) => { console.error(err); this.salesLoading = false; this.cdr.detectChanges(); }
    });
  }

  changeSalesPeriod(period: string) { this.selectedSalesPeriod = period; this.loadSalesReport(period); }

  getDailySummary(): { date: string; units: number; revenue: number; items: number }[] {
    if (!this.salesReport?.recent_imports?.length) return [];
    const map = new Map<string, { date: string; units: number; revenue: number; items: number }>();
    for (const row of this.salesReport.recent_imports) {
      const d = new Date(row.imported_at);
      const key = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear().toString().slice(2)}`;
      if (!map.has(key)) map.set(key, { date: key, units: 0, revenue: 0, items: 0 });
      const entry = map.get(key)!;
      entry.units += row.qty_sold || 0;
      entry.revenue += (row.qty_sold || 0) * (row.price || 0);
      entry.items += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  getBarPxRevenue(value: number): number {
    if (!this.salesReport?.chart_data?.length) return 0;
    const max = Math.max(...this.salesReport.chart_data.map(d => d.revenue), 1);
    return Math.max(4, Math.round((value / max) * 150));
  }

  getBarPxUnits(value: number): number {
    if (!this.salesReport?.chart_data?.length) return 0;
    const max = Math.max(...this.salesReport.chart_data.map(d => d.units), 1);
    return Math.max(4, Math.round((value / max) * 80));
  }

  formatChartDay(day: string): string {
    if (!day) return '';
    const d = new Date(day);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  logout() { sessionStorage.removeItem('admin_slug'); this.router.navigate(['/']); }
  goToPublic() { this.router.navigate(['/']); }

  get totalStock() { return this.plants.reduce((s, p) => s + (p.stock || 0), 0); }
  get lowStockPlants() { return this.plants.filter(p => p.stock > 0 && p.stock <= 5); }
  get outOfStockPlants() { return this.plants.filter(p => p.stock <= 0); }
  get estimatedInventoryValue() { return this.plants.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0); }

  get donutSegments() {
    const c = 2 * Math.PI * 44;
    const map = new Map<string, number>();
    this.plants.forEach(p => { const k = p.category || 'Sin categoría'; map.set(k, (map.get(k) || 0) + 1); });
    const total = this.plants.length || 1;
    let offset = 0; let ci = 0; const segs: any[] = [];
    map.forEach((count, category) => {
      const pct = count / total; const dash = pct * c;
      segs.push({ category, count, percent: Math.round(pct * 100), color: CHART_COLORS[ci % CHART_COLORS.length], dashArray: `${dash} ${c}`, dashOffset: -offset });
      offset += dash; ci++;
    });
    return segs;
  }

  getRowSuggestedPrice(item: RestockItem): number {
    if (!item.unit_cost || item.row_margin >= 100) return 0;
    return item.unit_cost / (1 - item.row_margin / 100);
  }
  getEffectivePrice(item: RestockItem): number {
    if (item.apply_suggested_price) return this.getRowSuggestedPrice(item);
    return item.current_sale_price ?? 0;
  }
  getRowProfit(item: RestockItem): number {
    const p = this.getEffectivePrice(item); if (!p) return 0;
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
    if (m >= 40) return 'Buen margen'; if (m >= 20) return 'Margen bajo'; return 'Sin margen';
  }
  getRowMarginTag(item: RestockItem): string {
    const m = this.getRowMargin(item);
    return m >= 40 ? 'tag-ok' : m >= 20 ? 'tag-suggested' : 'tag-warn';
  }
  get totalInvoiceCost(): number { return this.restockItems.reduce((s, i) => s + (i.unit_cost * i.quantity), 0); }

  onInvoiceSelected(event: any) { const f = event.target.files[0]; if (f) this.selectedInvoice = f; }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    this.plantService.analyzeInvoice(this.clientSlug, this.selectedInvoice).subscribe({
      next: (res) => {
        const items = res.result?.items || [];
        this.restockItems = this.buildRestockItems(items);
        this.invoiceLoading = false;
        this.cdr.detectChanges();
        this.renderIcons();
      },
      error: (err) => {
        console.error(err);
        this.invoiceLoading = false;
        this.restockItems = this.buildRestockItems([{ plant_name: 'Ficus Lyrata', quantity: 5, unit_cost: 15.0 }]);
        this.cdr.detectChanges();
        this.renderIcons();
      }
    });
  }

  buildRestockItems(raw: any[]): RestockItem[] {
    return raw.map(r => {
      const match = this.plants.find(p => p.name.toLowerCase().includes((r.plant_name || '').toLowerCase()));
      const hasPrice = match?.price != null && match.price > 0;
      return { plant_name: r.plant_name || '', category: r.category || match?.category || '', quantity: r.quantity || 1, unit_cost: r.unit_cost || 0, total_cost: (r.unit_cost || 0) * (r.quantity || 1), current_sale_price: match?.price ?? null, row_margin: this.desiredMargin, apply_suggested_price: !hasPrice };
    });
  }

  removeRestockItem(i: number) { this.restockItems.splice(i, 1); }

  confirmRestock() {
    if (!this.restockItems.length) return;
    const invalid = this.restockItems.filter(item => this.getEffectivePrice(item) <= 0);
    if (invalid.length) { alert(`Falta el precio de venta en: ${invalid.map(i => i.plant_name).join(', ')}`); return; }
    const items = this.restockItems.map(item => ({ plant_name: item.plant_name, quantity: item.quantity, unit_cost: item.unit_cost, new_price: this.getEffectivePrice(item), target_margin: item.row_margin }));
    this.plantService.restockPlants(this.clientSlug, items).subscribe({
      next: () => { this.cancelInvoice(); this.loadData(); alert('¡Inventario actualizado!'); },
      error: e => console.error(e)
    });
  }

  cancelInvoice() { this.selectedInvoice = null; this.restockItems = []; }

  onPosFileSelected(event: any) {
    const f = event.target.files[0];
    if (f) { this.posFile = f; this.posError = ''; this.posItems = []; this.posImportSuccessMsg = ''; }
  }

  analyzePosFile() {
    if (!this.posFile) return;
    this.posLoading = true; this.posError = ''; this.posImportSuccessMsg = '';
    const formData = new FormData();
    formData.append('file', this.posFile);
    this.plantService.analyzePosFile(this.clientSlug, formData).subscribe({
      next: (res) => { this.posItems = res.items.map((i: any) => ({ ...i, skip: i.status === 'not_found' })); this.posLoading = false; this.cdr.detectChanges(); this.renderIcons(); },
      error: (err) => { this.posError = err.error?.message || 'Error analizando el archivo.'; this.posLoading = false; this.cdr.detectChanges(); }
    });
  }

  confirmPosImport() {
    const toImport = this.posItems.filter(i => !i.skip && i.matched_plant_id);
    if (!toImport.length) { alert('No hay productos válidos para importar.'); return; }
    this.plantService.confirmPosImport(this.clientSlug, toImport, this.posFile?.name || 'import').subscribe({
      next: (res) => {
        const totalItems = res.summary?.total_items ?? toImport.length;
        const totalUnits = res.summary?.total_units ?? 0;
        this.cancelPosImport();
        this.loadData();
        this.loadSalesReport(this.selectedSalesPeriod);
        this.posImportSuccessMsg = `Ventas importadas correctamente. ${totalItems} producto(s), ${totalUnits} unidad(es) descontadas.`;
        setTimeout(() => { this.posImportSuccessMsg = ''; this.cdr.detectChanges(); }, 7000);
        this.cdr.detectChanges(); this.renderIcons();
      },
      error: e => { this.posError = 'Error confirmando la importación.'; console.error(e); this.cdr.detectChanges(); }
    });
  }

  cancelPosImport() { this.posFile = null; this.posItems = []; this.posError = ''; }

  countPosStatus(status: string): number { return this.posItems.filter(i => i.status === status).length; }
  getPosBadgeBg(s: string) { return s === 'found' ? '#D1FAE5' : s === 'review' ? '#FEF3C7' : '#FEE2E2'; }
  getPosBadgeColor(s: string) { return s === 'found' ? '#065F46' : s === 'review' ? '#92400E' : '#991B1B'; }
  getPosBadgeLabel(s: string) { return s === 'found' ? 'Encontrado' : s === 'review' ? 'Revisar' : 'No encontrado'; }

  savePlant() {
    if (!this.plantForm.name) return;
    const req = this.editingId ? this.plantService.updatePlant(this.editingId, this.plantForm) : this.plantService.createPlant(this.clientSlug, this.plantForm);
    req.subscribe({ next: () => { this.resetForm(); this.showForm = false; this.loadData(); }, error: e => console.error(e) });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    this.showForm = true;
    this.activeTab = 'inventario'; // ✅ asegura que estás en la tab correcta
    this.cdr.detectChanges();      // ✅ fuerza render inmediato
    setTimeout(() => {
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderIcons();
    }, 100);
  }

  removePlant(plant: Plant) {
    if (!plant.id) return;
    if (confirm(`¿Eliminar ${plant.name}?`)) {
      this.plantService.deletePlant(plant.id).subscribe({ next: () => this.loadData(), error: e => console.error(e) });
    }
  }

  resetForm() { this.editingId = undefined; this.plantForm = this.emptyPlant(); }

  emptyPlant(): Plant {
    return { name: '', category: '', description: '', price: undefined as any, cost_price: undefined as any, stock: undefined as any, image_url: '', light: '', water: '', is_featured: false, is_active: true };
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