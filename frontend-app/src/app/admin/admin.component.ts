import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant, SalesReport, Category, AdminUser, UserRole, ROLE_LABELS, PERMISSIONS, LoginResponse } from '../services/plant.service';
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
  total_cost: number; current_sale_price: number | null; row_margin: number; apply_suggested_price: boolean; custom_price?: number;
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
            <span class="brand-title">{{ currentName || 'Admin' }}</span>
            <span class="brand-sub">{{ ROLE_LABELS[currentRole] }}</span>
          </div>
        </div>
        
        <nav class="nav-menu">
          <button *ngIf="PERMISSIONS.canSeeDashboard(currentRole)" class="nav-item" [class.active]="activeTab==='dashboard'" (click)="setTab('dashboard')">
            <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
          </button>
          <button class="nav-item" [class.active]="activeTab==='inventario'" (click)="setTab('inventario')">
            <i data-lucide="package"></i> <span>Inventario</span>
          </button>
          <button *ngIf="PERMISSIONS.canSeeStock(currentRole)" class="nav-item" [class.active]="activeTab==='stock'" (click)="setTab('stock')">
            <i data-lucide="shopping-cart"></i> <span>Stock</span>
          </button>
          <button *ngIf="PERMISSIONS.canSeeVentas(currentRole)" class="nav-item" [class.active]="activeTab==='ventas'" (click)="setTab('ventas')">
            <i data-lucide="trending-up"></i> <span>Ventas &amp; Ganancias</span>
          </button>
          
          <div class="nav-divider"></div>
          
          <button *ngIf="PERMISSIONS.canImportPOS(currentRole)" class="nav-item" [class.active]="activeTab==='pos'" (click)="setTab('pos')">
            <i data-lucide="upload-cloud"></i> <span>Importar POS</span>
          </button>
          <button *ngIf="PERMISSIONS.canSeeCategorias(currentRole)" class="nav-item" [class.active]="activeTab==='categorias'" (click)="setTab('categorias')">
            <i data-lucide="folder-open"></i> <span>Categorías</span>
          </button>
          <button *ngIf="PERMISSIONS.canManageUsers(currentRole)" class="nav-item" [class.active]="activeTab==='usuarios'" (click)="setTab('usuarios')">
            <i data-lucide="users"></i> <span>Usuarios</span>
          </button>
          <button *ngIf="PERMISSIONS.canSeeAjustes(currentRole)" class="nav-item" [class.active]="activeTab==='ajustes'" (click)="setTab('ajustes')">
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
            <button *ngIf="activeTab==='inventario' && PERMISSIONS.canEditInventoryFull(currentRole)" class="btn-primary" (click)="showForm = !showForm">
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

          <div class="card" style="margin-bottom:30px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <div>
                <div style="font-size:1.1rem; font-weight:700; color:var(--text-main);">Ventas (14 días)</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Ingresos diarios del período</div>
              </div>
              <div style="position:relative;">
                <button (click)="chartDropdownOpen = !chartDropdownOpen" style="background:white; border:1px solid var(--border); border-radius:10px; padding:7px 14px; font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; color:var(--text-main);">
                  <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                  {{ chartPeriodLabel }}
                  <i data-lucide="chevron-down" style="width:14px;height:14px;"></i>
                </button>
                <div *ngIf="chartDropdownOpen" style="position:absolute; right:0; top:calc(100% + 6px); background:white; border:1px solid var(--border); border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.1); z-index:50; min-width:140px; overflow:hidden;">
                  <div *ngFor="let p of salesPeriods" (click)="selectChartPeriod(p)"
                    style="padding:10px 16px; font-size:0.85rem; cursor:pointer; font-weight:500; transition:background 0.15s;"
                    [style.background]="selectedSalesPeriod === p.value ? '#ECFDF5' : 'white'"
                    [style.color]="selectedSalesPeriod === p.value ? '#065F46' : 'var(--text-main)'">
                    {{ p.label }}
                  </div>
                </div>
              </div>
            </div>

            <div style="position:relative;" (mouseleave)="chartTooltip = null" (click)="chartDropdownOpen = false">
              <svg [attr.viewBox]="'0 0 700 220'" width="100%" height="220" style="overflow:visible;">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10B981" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#10B981" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>

                <!-- Y axis lines and labels -->
                <ng-container *ngFor="let tick of getYTicks()">
                  <line [attr.x1]="50" [attr.y1]="tick.y" [attr.x2]="680" [attr.y2]="tick.y"
                    stroke="#F3F4F6" stroke-width="1" stroke-dasharray="4,4"/>
                  <text [attr.x]="44" [attr.y]="tick.y + 4" text-anchor="end"
                    style="font-size:9px; fill:#9CA3AF;">
                    \${{ tick.value | number:'1.0-0' }}
                  </text>
                </ng-container>

                <!-- Area and line -->
                <path [attr.d]="getAreaPath()" fill="url(#areaGrad)"/>
                <path [attr.d]="getLinePath()" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

                <!-- Hover zones -->
                <circle *ngFor="let pt of getChartPoints(); let i = index"
                  [attr.cx]="pt.x" [attr.cy]="pt.y" r="18" fill="transparent"
                  style="cursor:pointer;"
                  (mouseenter)="onChartHover(i, pt)">
                </circle>

                <!-- Active point highlight -->
                <ng-container *ngIf="chartTooltip">
                  <circle [attr.cx]="chartTooltip.x" [attr.cy]="chartTooltip.y" r="7"
                    fill="#10B981" opacity="0.2"/>
                  <circle [attr.cx]="chartTooltip.x" [attr.cy]="chartTooltip.y" r="4"
                    fill="white" stroke="#10B981" stroke-width="2.5"/>
                </ng-container>

                <!-- Dots -->
                <circle *ngFor="let pt of getChartPoints()"
                  [attr.cx]="pt.x" [attr.cy]="pt.y" r="3"
                  fill="white" stroke="#10B981" stroke-width="1.5"/>

                <!-- X labels -->
                <text *ngFor="let pt of getChartPoints(); let i = index"
                  [attr.x]="pt.x" y="215" text-anchor="middle"
                  style="font-size:9px;fill:#9CA3AF;">
                  {{ formatChartDay(salesReport!.chart_data[i].day) }}
                </text>
              </svg>

              <!-- Rich Tooltip -->
              <div *ngIf="chartTooltip"
                style="position:absolute; background:white; border:1px solid var(--border); border-radius:14px; padding:16px; font-size:0.8rem; pointer-events:none; box-shadow:0 8px 24px rgba(0,0,0,0.12); width:240px; z-index:20;"
                [style.left.px]="chartTooltip.x > 450 ? chartTooltip.x - 256 : chartTooltip.x + 16"
                [style.top.px]="chartTooltip.y - 20">

                <!-- Header -->
                <div style="font-weight:700; color:var(--text-main); margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid var(--border); font-size:0.85rem;">
                  📅 Detalles del Día: {{ chartTooltip.fullDate }}
                </div>

                <!-- Main metrics -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                  <div style="background:#F9FAFB; border-radius:8px; padding:8px;">
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">Ventas Totales</div>
                    <div style="font-weight:700; color:#10B981; font-size:1rem;">\${{ chartTooltip.d.revenue | number:'1.0-0' }}</div>
                  </div>
                  <div style="background:#F9FAFB; border-radius:8px; padding:8px;">
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">Unidades</div>
                    <div style="font-weight:700; color:var(--text-main); font-size:1rem;">{{ chartTooltip.d.units }}</div>
                  </div>
                </div>

                <!-- AOV -->
                <div style="background:#ECFDF5; border-radius:8px; padding:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.7rem; color:#065F46; font-weight:600;">AOV (Ticket Promedio)</span>
                  <span style="font-weight:700; color:#065F46;">\${{ chartTooltip.aov | number:'1.2-2' }}</span>
                </div>

                <!-- Comparatives -->
                <div style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border);">
                  <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Comparativas</div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:var(--text-muted);">vs día anterior</span>
                    <span [style.color]="chartTooltip.vsPrev >= 0 ? '#10B981' : '#EF4444'" style="font-weight:700;">
                      {{ chartTooltip.vsPrev >= 0 ? '▲' : '▼' }} {{ chartTooltip.vsPrev | number:'1.0-0' }}%
                    </span>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">vs semana anterior</span>
                    <span [style.color]="chartTooltip.vsWeek >= 0 ? '#10B981' : '#EF4444'" style="font-weight:700;">
                      {{ chartTooltip.vsWeek >= 0 ? '▲' : '▼' }} {{ chartTooltip.vsWeek | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>

                <!-- Category breakdown -->
                <div>
                  <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Por Categoría</div>
                  <div *ngFor="let cat of chartTooltip.categories" style="display:flex; justify-content:space-between; margin-bottom:3px; font-size:0.75rem;">
                    <span style="display:flex; align-items:center; gap:5px;">
                      <span style="width:6px;height:6px;border-radius:50%;background:#10B981;display:inline-block;"></span>
                      {{ cat.name }}
                    </span>
                    <span style="font-weight:600;">\${{ cat.revenue | number:'1.0-0' }}</span>
                  </div>
                  <div *ngIf="!chartTooltip.categories?.length" style="color:var(--text-muted); font-style:italic;">Sin desglose disponible</div>
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
              <div *ngIf="PERMISSIONS.canEditInventoryFull(currentRole)" class="form-group">
                <label class="form-label">Categoría</label>
                <select [(ngModel)]="plantForm.category" class="form-input">
                  <optgroup *ngFor="let group of CATEGORY_GROUPS" [label]="group.label">
                    <option *ngFor="let cat of group.items" [value]="cat">{{ cat }}</option>
                  </optgroup>
                </select>
              </div>
              <div *ngIf="PERMISSIONS.canEditInventoryFull(currentRole)" class="form-group"><label class="form-label">Precio de Venta ($)</label><input type="number" [(ngModel)]="plantForm.price" class="form-input"></div>
              <div *ngIf="PERMISSIONS.canEditInventoryFull(currentRole)" class="form-group"><label class="form-label">Costo de Compra ($)</label><input type="number" [(ngModel)]="plantForm.cost_price" class="form-input"></div>
              <div *ngIf="PERMISSIONS.canEditInventoryFull(currentRole)" class="form-group"><label class="form-label">Stock Inicial</label><input type="number" [(ngModel)]="plantForm.stock" class="form-input"></div>
              <div class="form-group">
                <label class="form-label">Luz</label>
                <select [(ngModel)]="plantForm.light" class="form-input">
                  <option value="">-- Sin especificar --</option>
                  <option value="Sol pleno">Sol pleno</option>
                  <option value="Sol parcial">Sol parcial</option>
                  <option value="Luz indirecta">Luz indirecta</option>
                  <option value="Baja a media">Baja a media</option>
                  <option value="Sombra">Sombra</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Agua</label>
                <select [(ngModel)]="plantForm.water" class="form-input">
                  <option value="">-- Sin especificar --</option>
                  <option value="Poca">Poca</option>
                  <option value="Moderada">Moderada</option>
                  <option value="Abundante">Abundante</option>
                </select>
              </div>
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
            <app-plant-card *ngFor="let p of filteredInventory" [plant]="p"
              [adminMode]="true"
              [client]="client"
              (onEdit)="PERMISSIONS.canEditInventoryFull(currentRole) ? editPlant($event) : editPlantVendor($event)"
              (onRemove)="PERMISSIONS.canEditInventoryFull(currentRole) ? removePlant($event) : null">
            </app-plant-card>
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
            <h3 style="margin:0 0 8px; display:flex; align-items:center; gap:8px;"><i data-lucide="sparkles"></i> Actualizar con Factura</h3>
            <p style="font-size:0.9rem; opacity:0.9; margin-bottom:16px;">Sube la factura de tu proveedor para actualizar cantidades y costos automáticamente.</p>
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
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Costo Unit.</th>
                  <th>Precio Sugerido (50%)</th>
                  <th>Precio Venta Cliente</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of restockItems; let i = index">
                  <td><input type="text" [(ngModel)]="item.plant_name" class="form-input" style="padding:6px; height:auto;"></td>
                  <td><input type="number" [(ngModel)]="item.quantity" class="form-input" style="padding:6px; width:70px; height:auto;"></td>
                  <td><input type="number" [(ngModel)]="item.unit_cost" class="form-input" style="padding:6px; width:90px; height:auto;"></td>
                  <td>
                    <div style="font-size:0.85rem; color:#10B981; font-weight:600;">\${{ getRowSuggestedPrice(item) | number:'1.2-2' }}</div>
                    <button style="margin-top:4px; font-size:0.7rem; background:none; border:1px solid #10B981; color:#10B981; border-radius:6px; padding:2px 8px; cursor:pointer;"
                      (click)="item.custom_price = getRowSuggestedPrice(item)">
                      Usar este
                    </button>
                  </td>
                  <td>
                    <input type="number" [(ngModel)]="item.custom_price" class="form-input"
                      style="padding:6px; width:100px; height:auto; border-color: item.custom_price ? '#10B981' : 'var(--border)';"
                      placeholder="$0.00">
                    <div *ngIf="item.custom_price && item.unit_cost" style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                      Margen: {{ getCustomMargin(item) | number:'1.0-1' }}%
                    </div>
                  </td>
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
            <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0; font-size:1.1rem;">Transacciones Recientes</h3>
              <span style="font-size:0.8rem; color:var(--text-muted);">Haz clic en una fecha para ver el detalle</span>
            </div>
            <table>
              <thead><tr><th>Fecha</th><th>Productos</th><th>Unidades</th><th>Total</th><th>Ganancia</th><th></th></tr></thead>
              <tbody>
                <ng-container *ngFor="let group of getGroupedTransactions()">
                  <!-- Fila resumen por fecha -->
                  <tr (click)="toggleDateGroup(group.date)" style="cursor:pointer; background:#F9FAFB;">
                    <td style="font-weight:700; color:var(--text-main);">{{ group.date }}</td>
                    <td style="color:var(--text-muted);">{{ group.items.length }} productos</td>
                    <td style="font-weight:600;">{{ group.totalUnits }}</td>
                    <td style="font-weight:700;">\${{ group.totalRevenue | number:'1.2-2' }}</td>
                    <td style="font-weight:700; color:#10B981;">\${{ group.totalProfit | number:'1.2-2' }}</td>
                    <td>
                      <i [attr.data-lucide]="expandedDates.has(group.date) ? 'chevron-up' : 'chevron-down'" style="width:16px;height:16px;color:var(--text-muted);"></i>
                    </td>
                  </tr>
                  <!-- Filas detalle expandibles -->
                  <ng-container *ngIf="expandedDates.has(group.date)">
                    <tr *ngFor="let item of group.items" style="background:#FAFFFE;">
                      <td style="color:var(--text-muted); padding-left:32px;">
                        <i data-lucide="corner-down-right" style="width:12px;height:12px;margin-right:6px;color:var(--text-muted);"></i>
                        {{ item.imported_at | date:'h:mm a' }}
                      </td>
                      <td style="font-weight:600;">{{ item.plant_name }}</td>
                      <td>{{ item.qty_sold }}</td>
                      <td style="font-weight:700;">\${{ (item.qty_sold * item.price) | number:'1.2-2' }}</td>
                      <td style="font-weight:700; color:#10B981;">\${{ (item.qty_sold * (item.price - (item.cost_price || 0))) | number:'1.2-2' }}</td>
                      <td></td>
                    </tr>
                  </ng-container>
                </ng-container>
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

        <!-- USUARIOS -->
        <div *ngIf="activeTab==='usuarios'">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <p style="font-size:0.9rem; color:var(--text-muted);">Gestiona los accesos de tu equipo. Cada rol tiene permisos distintos.</p>
            <button class="btn-primary" (click)="openUserForm()">
              <i data-lucide="plus"></i> Nuevo usuario
            </button>
          </div>

          <!-- Formulario crear/editar usuario -->
          <div *ngIf="showUserForm" class="card" style="margin-bottom:24px; border-left:4px solid #10B981;">
            <h3 style="margin:0 0 20px; font-size:1.1rem;">{{ editingUserId ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:16px;">
              <div class="form-group">
                <label class="form-label">Nombre completo</label>
                <input type="text" [(ngModel)]="userForm.name" class="form-input" placeholder="Ej: María González">
              </div>
              <div class="form-group">
                <label class="form-label">Usuario (para login)</label>
                <input type="text" [(ngModel)]="userForm.username" class="form-input" placeholder="Ej: maria">
              </div>
              <div class="form-group">
                <label class="form-label">{{ editingUserId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña' }}</label>
                <input type="password" [(ngModel)]="userForm.password" class="form-input" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label class="form-label">Rol</label>
                <select [(ngModel)]="userForm.role" class="form-input">
                  <option value="owner">Dueño — acceso total</option>
                  <option value="manager">Gerente — sin ventas/ajustes</option>
                  <option value="vendor">Vendedor — solo fotos y nombres</option>
                </select>
              </div>
            </div>
            <div *ngIf="userError" style="color:#DC2626; font-size:0.85rem; font-weight:600; margin:8px 0;">{{ userError }}</div>
            <div *ngIf="userSuccess" style="color:#10B981; font-size:0.85rem; font-weight:600; margin:8px 0;">{{ userSuccess }}</div>
            <div style="display:flex; gap:12px; margin-top:16px;">
              <button class="btn-primary" (click)="saveUser()" [disabled]="userSaving">
                {{ userSaving ? 'Guardando...' : editingUserId ? 'Actualizar' : 'Crear usuario' }}
              </button>
              <button class="btn-outline" (click)="showUserForm = false; userError = ''">Cancelar</button>
            </div>
          </div>

          <!-- Tabla de usuarios -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of adminUsers">
                  <td style="font-weight:600;">{{ u.name }}</td>
                  <td style="color:var(--text-muted);">{{ u.username }}</td>
                  <td>
                    <span class="status-pill"
                      [style.background]="u.role === 'owner' ? '#ECFDF5' : u.role === 'manager' ? '#EFF6FF' : '#F5F3FF'"
                      [style.color]="u.role === 'owner' ? '#065F46' : u.role === 'manager' ? '#1D4ED8' : '#6D28D9'">
                      {{ ROLE_LABELS[u.role] }}
                    </span>
                  </td>
                  <td>
                    <span class="status-pill"
                      [style.background]="u.is_active ? '#D1FAE5' : '#FEE2E2'"
                      [style.color]="u.is_active ? '#065F46' : '#991B1B'">
                      {{ u.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td style="display:flex; gap:8px;">
                    <button class="btn-outline" style="padding:5px 12px; font-size:0.8rem;" (click)="openUserForm(u)">
                      <i data-lucide="pencil" style="width:14px;height:14px;"></i> Editar
                    </button>
                    <button class="btn-outline" style="padding:5px 12px; font-size:0.8rem;"
                      [style.color]="u.is_active ? '#DC2626' : '#10B981'"
                      (click)="toggleUserActive(u)">
                      {{ u.is_active ? 'Desactivar' : 'Reactivar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Leyenda de roles -->
          <div class="card" style="margin-top:24px; background:#F9FAFB;">
            <h3 style="margin:0 0 16px; font-size:1rem;">Permisos por rol</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:16px; font-size:0.85rem;">
              <div>
                <div style="font-weight:700; color:#065F46; margin-bottom:8px;">👑 Dueño</div>
                <div style="color:var(--text-muted); line-height:1.8;">
                  ✅ Dashboard completo<br>
                  ✅ Ventas y ganancias<br>
                  ✅ Stock y alertas<br>
                  ✅ Importar POS<br>
                  ✅ Restock con factura<br>
                  ✅ Inventario completo<br>
                  ✅ Categorías<br>
                  ✅ Ajustes<br>
                  ✅ Gestionar usuarios
                </div>
              </div>
              <div>
                <div style="font-weight:700; color:#1D4ED8; margin-bottom:8px;">🏢 Gerente</div>
                <div style="color:var(--text-muted); line-height:1.8;">
                  ✅ Dashboard (sin $$)<br>
                  ❌ Ventas y ganancias<br>
                  ✅ Stock y alertas<br>
                  ✅ Importar POS<br>
                  ✅ Restock con factura<br>
                  ✅ Inventario completo<br>
                  ✅ Categorías<br>
                  ❌ Ajustes<br>
                  ❌ Gestionar usuarios
                </div>
              </div>
              <div>
                <div style="font-weight:700; color:#6D28D9; margin-bottom:8px;">🏷️ Vendedor</div>
                <div style="color:var(--text-muted); line-height:1.8;">
                  ❌ Dashboard<br>
                  ❌ Ventas y ganancias<br>
                  ❌ Stock y alertas<br>
                  ❌ Importar POS<br>
                  ❌ Restock con factura<br>
                  ✅ Fotos, nombre y descripción<br>
                  ❌ Categorías<br>
                  ❌ Ajustes<br>
                  ❌ Gestionar usuarios
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CATEGORÍAS -->
        <div *ngIf="activeTab==='categorias'">
          <div style="margin-bottom:20px;">
            <p style="font-size:0.9rem; color:var(--text-muted);">Edita el nombre, descripción e ideal de cada categoría. Los cambios se reflejan de inmediato en tu tienda pública.</p>
          </div>

          <div style="margin-bottom:12px;">
            <div class="group-label" style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#10B981;display:flex;align-items:center;gap:6px;">
              <i data-lucide="leaf" style="width:12px;height:12px;"></i> Plantas
            </div>
          </div>
          <div *ngFor="let cat of categories.filter(c => c.group_type === 'plants')" class="card" style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <i [attr.data-lucide]="cat.icon" style="width:20px;height:20px;color:#10B981;"></i>
                <span style="font-weight:700; font-size:1rem;">{{ cat.name }}</span>
              </div>
              <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" (click)="saveCategory(cat)">
                {{ categorySaving === cat.id ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:12px;">
              <div class="form-group">
                <label class="form-label">Nombre (español)</label>
                <input type="text" [(ngModel)]="cat.name" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Nombre (inglés)</label>
                <input type="text" [(ngModel)]="cat.name_en" class="form-input">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Descripción (español)</label>
                <textarea [(ngModel)]="cat.description" class="form-input" style="min-height:60px;"></textarea>
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Descripción (inglés)</label>
                <textarea [(ngModel)]="cat.description_en" class="form-input" style="min-height:60px;"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Ideal para (español)</label>
                <input type="text" [(ngModel)]="cat.ideal" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Ideal para (inglés)</label>
                <input type="text" [(ngModel)]="cat.ideal_en" class="form-input">
              </div>
            </div>
            <div *ngIf="categorySaved === cat.id" style="color:#10B981; font-size:0.8rem; font-weight:600; margin-top:8px;">¡Guardado correctamente!</div>
          </div>

          <div style="margin:20px 0 12px;">
            <div class="group-label" style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c87830;display:flex;align-items:center;gap:6px;">
              <i data-lucide="shopping-bag" style="width:12px;height:12px;"></i> Productos de jardín
            </div>
          </div>
          <div *ngFor="let cat of categories.filter(c => c.group_type === 'products')" class="card" style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <i [attr.data-lucide]="cat.icon" style="width:20px;height:20px;color:#c87830;"></i>
                <span style="font-weight:700; font-size:1rem;">{{ cat.name }}</span>
              </div>
              <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" (click)="saveCategory(cat)">
                {{ categorySaving === cat.id ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:12px;">
              <div class="form-group">
                <label class="form-label">Nombre (español)</label>
                <input type="text" [(ngModel)]="cat.name" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Nombre (inglés)</label>
                <input type="text" [(ngModel)]="cat.name_en" class="form-input">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Descripción (español)</label>
                <textarea [(ngModel)]="cat.description" class="form-input" style="min-height:60px;"></textarea>
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Descripción (inglés)</label>
                <textarea [(ngModel)]="cat.description_en" class="form-input" style="min-height:60px;"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Ideal para (español)</label>
                <input type="text" [(ngModel)]="cat.ideal" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Ideal para (inglés)</label>
                <input type="text" [(ngModel)]="cat.ideal_en" class="form-input">
              </div>
            </div>
            <div *ngIf="categorySaved === cat.id" style="color:#10B981; font-size:0.8rem; font-weight:600; margin-top:8px;">¡Guardado correctamente!</div>
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

  activeTab: 'dashboard' | 'ventas' | 'inventario' | 'pos' | 'stock' | 'ajustes' | 'categorias' | 'usuarios' = 'dashboard';
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

  categories: Category[] = [];
  categorySaving: number | null = null;
  categorySaved: number | null = null;

  // Roles
  readonly ROLE_LABELS = ROLE_LABELS;
  readonly PERMISSIONS = PERMISSIONS;
  get currentRole(): UserRole { return this.plantService.getRole() || 'vendor'; }
  get currentName(): string { return this.plantService.getName(); }

  // Usuarios
  adminUsers: AdminUser[] = [];
  userForm: Partial<AdminUser & { password?: string }> = {};
  editingUserId?: number;
  showUserForm = false;
  userSaving = false;
  userError = '';
  userSuccess = '';

  salesReport: SalesReport | null = null;
  salesLoading = false;
  chartTooltip: any = null;
  chartDropdownOpen = false;
  expandedDates = new Set<string>();
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

  get storeUrl(): string { return `https://\${this.clientSlug}.verzagarden.com`; }
  get chartPeriodLabel(): string {
    return this.salesPeriods.find(p => p.value === this.selectedSalesPeriod)?.label || '30 días';
  }

  constructor(private plantService: PlantService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const slug = sessionStorage.getItem('admin_slug');
    const role = this.plantService.getRole();
    if (!slug || slug !== this.clientSlug || !role) { this.router.navigate(['/']); return; }
    // Redirigir vendedor directo al inventario
    if (role === 'vendor') { this.activeTab = 'inventario'; }
    this.loadData();
    if (this.PERMISSIONS.canSeeVentas(role)) this.loadSalesReport(this.selectedSalesPeriod);
  }

  ngAfterViewInit() { this.renderIcons(); }

  renderIcons() {
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
  }

  setTab(tab: 'dashboard' | 'ventas' | 'inventario' | 'pos' | 'stock' | 'ajustes' | 'categorias' | 'usuarios') {
    this.activeTab = tab;
    if (tab === 'categorias' && !this.categories.length) this.loadCategories();
    if (tab === 'usuarios') this.loadAdminUsers();
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
      'categorias': 'Categorías',
      'ajustes': 'Ajustes',
      'usuarios': 'Usuarios'
    };
    return titles[this.activeTab];
  }

  loadCategories() {
    this.plantService.getCategories(this.clientSlug).subscribe({
      next: cats => { this.categories = cats; this.cdr.detectChanges(); this.renderIcons(); },
      error: err => console.error('Error cargando categorías:', err)
    });
  }

  // =======================
  // 👥 Usuarios
  // =======================
  loadAdminUsers() {
    this.plantService.getAdminUsers(this.clientSlug).subscribe({
      next: users => { this.adminUsers = users; this.cdr.detectChanges(); this.renderIcons(); },
      error: err => console.error('Error cargando usuarios:', err)
    });
  }

  openUserForm(user?: AdminUser) {
    if (user) {
      this.editingUserId = user.id;
      this.userForm = { name: user.name, username: user.username, role: user.role, password: '' };
    } else {
      this.editingUserId = undefined;
      this.userForm = { name: '', username: '', role: 'vendor', password: '' };
    }
    this.showUserForm = true;
    this.userError = '';
    this.userSuccess = '';
    setTimeout(() => this.renderIcons(), 50);
  }

  saveUser() {
    this.userError = '';
    if (!this.userForm.name || !this.userForm.username) {
      this.userError = 'Nombre y usuario son requeridos'; return;
    }
    if (!this.editingUserId && !this.userForm.password) {
      this.userError = 'La contraseña es requerida para usuarios nuevos'; return;
    }
    this.userSaving = true;
    const req = this.editingUserId
      ? this.plantService.updateAdminUser(this.clientSlug, this.editingUserId, this.userForm)
      : this.plantService.createAdminUser(this.clientSlug, {
          name: this.userForm.name!,
          username: this.userForm.username!,
          password: this.userForm.password!,
          role: this.userForm.role as UserRole
        });
    req.subscribe({
      next: () => {
        this.userSaving = false;
        this.userSuccess = this.editingUserId ? 'Usuario actualizado' : 'Usuario creado';
        this.showUserForm = false;
        this.loadAdminUsers();
        this.cdr.detectChanges();
        setTimeout(() => { this.userSuccess = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.userSaving = false;
        this.userError = err.error?.message || 'Error guardando usuario';
        this.cdr.detectChanges();
      }
    });
  }

  toggleUserActive(user: AdminUser) {
    const action = user.is_active ? 'desactivar' : 'reactivar';
    if (!confirm(`¿Quieres ${action} a ${user.name}?`)) return;
    this.plantService.updateAdminUser(this.clientSlug, user.id, { is_active: !user.is_active }).subscribe({
      next: () => { this.loadAdminUsers(); },
      error: (err) => { alert(err.error?.message || 'Error actualizando usuario'); }
    });
  }

  getRoleBadgeColor(role: UserRole): string {
    if (role === 'owner')   return '#ECFDF5; color:#065F46';
    if (role === 'manager') return '#EFF6FF; color:#1D4ED8';
    return '#F5F3FF; color:#6D28D9';
  }

  saveCategory(cat: Category) {
    this.categorySaving = cat.id;
    this.plantService.updateCategory(this.clientSlug, cat.id, {
      name: cat.name,
      name_en: cat.name_en,
      description: cat.description,
      description_en: cat.description_en,
      ideal: cat.ideal,
      ideal_en: cat.ideal_en,
      icon: cat.icon
    }).subscribe({
      next: () => {
        this.categorySaving = null;
        this.categorySaved = cat.id;
        this.cdr.detectChanges();
        setTimeout(() => { this.categorySaved = null; this.cdr.detectChanges(); }, 3000);
      },
      error: err => { console.error(err); this.categorySaving = null; this.cdr.detectChanges(); }
    });
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

  // =======================
  // 📈 Chart helpers
  // =======================
  getChartPoints(): { x: number; y: number }[] {
    const data = this.salesReport?.chart_data;
    if (!data?.length) return [];
    const W = 700, H = 190, padL = 55, padR = 20;
    const maxRev = Math.max(...data.map((d: any) => d.revenue), 1);
    return data.map((d: any, i: number) => ({
      x: padL + (i / Math.max(data.length - 1, 1)) * (W - padL - padR),
      y: 10 + ((1 - d.revenue / maxRev) * (H - 30))
    }));
  }

  getYTicks(): { y: number; value: number }[] {
    const data = this.salesReport?.chart_data;
    if (!data?.length) return [];
    const maxRev = Math.max(...data.map((d: any) => d.revenue), 1);
    const step = Math.ceil(maxRev / 4 / 100) * 100;
    const ticks = [];
    const H = 190, padL = 55;
    for (let v = 0; v <= maxRev; v += step) {
      const y = 10 + ((1 - v / maxRev) * (H - 30));
      ticks.push({ y, value: v });
    }
    return ticks;
  }

  selectChartPeriod(p: any) {
    this.chartDropdownOpen = false;
    this.changeSalesPeriod(p.value);
  }

  onChartHover(i: number, pt: { x: number; y: number }) {
    const data = this.salesReport?.chart_data;
    if (!data) return;
    const d = data[i];
    const prev = i > 0 ? data[i - 1] : null;
    const weekAgo = i >= 7 ? data[i - 7] : null;
    const vsPrev = prev && prev.revenue > 0 ? ((d.revenue - prev.revenue) / prev.revenue) * 100 : 0;
    const vsWeek = weekAgo && weekAgo.revenue > 0 ? ((d.revenue - weekAgo.revenue) / weekAgo.revenue) * 100 : 0;
    const aov = d.units > 0 ? d.revenue / d.units : 0;
    // Build category breakdown from recent_imports for this day
    const dayStr = d.day instanceof Date ? d.day.toISOString().split('T')[0] : String(d.day).split('T')[0];
    const catMap = new Map<string, number>();
    if (this.salesReport?.recent_imports) {
      for (const row of this.salesReport.recent_imports) {
        const rowDay = String(row.imported_at).split('T')[0].split(' ')[0];
        if (rowDay === dayStr && row.plant_name) {
          const cat = row.category || 'Sin categoría';
          catMap.set(cat, (catMap.get(cat) || 0) + (row.qty_sold * row.price));
        }
      }
    }
    const categories = Array.from(catMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
    const dateObj = new Date(d.day);
    const fullDate = dateObj.toLocaleDateString('es-PR', { weekday: 'short', month: 'short', day: 'numeric' });
    this.chartTooltip = { idx: i, x: pt.x, y: pt.y, d, vsPrev, vsWeek, aov, categories, fullDate };
    this.cdr.detectChanges();
  }

  getLinePath(): string {
    const pts = this.getChartPoints();
    if (!pts.length) return '';
    // Con un solo punto dibujamos una línea horizontal
    if (pts.length === 1) return `M 30 ${pts[0].y} L 570 ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cp1x} ${pts[i - 1].y} ${cp1x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }

  getAreaPath(): string {
    const pts = this.getChartPoints();
    if (!pts.length) return '';
    if (pts.length === 1) return `M 55 ${pts[0].y} L 680 ${pts[0].y} L 680 170 L 55 170 Z`;
    const line = this.getLinePath();
    return `${line} L ${pts[pts.length - 1].x} 170 L ${pts[0].x} 170 Z`;
  }

  // =======================
  // 📋 Grouped transactions
  // =======================
  getGroupedTransactions(): { date: string; items: any[]; totalUnits: number; totalRevenue: number; totalProfit: number }[] {
    if (!this.salesReport?.recent_imports?.length) return [];
    const map = new Map<string, any[]>();
    for (const row of this.salesReport.recent_imports) {
      const d = new Date(row.imported_at);
      const key = d.toLocaleDateString('es-PR', { year: 'numeric', month: 'short', day: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      totalUnits:   items.reduce((s, i) => s + (i.qty_sold || 0), 0),
      totalRevenue: items.reduce((s, i) => s + ((i.qty_sold || 0) * (i.price || 0)), 0),
      totalProfit:  items.reduce((s, i) => s + ((i.qty_sold || 0) * ((i.price || 0) - (i.cost_price || 0))), 0),
    }));
  }

  toggleDateGroup(date: string) {
    if (this.expandedDates.has(date)) this.expandedDates.delete(date);
    else this.expandedDates.add(date);
    this.cdr.detectChanges();
    this.renderIcons();
  }

  formatChartDay(day: string): string {
    if (!day) return '';
    const d = new Date(day);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  logout() { this.plantService.clearSession(); this.router.navigate(['/']); }
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

  getCustomMargin(item: RestockItem): number {
    if (!item.custom_price || !item.unit_cost) return 0;
    return ((item.custom_price - item.unit_cost) / item.custom_price) * 100;
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
        const items = res.items || res.result?.items || [];
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
      return { plant_name: r.plant_name || '', category: r.category || match?.category || '', quantity: r.quantity || 1, unit_cost: r.unit_cost || 0, total_cost: (r.unit_cost || 0) * (r.quantity || 1), current_sale_price: match?.price ?? null, row_margin: this.desiredMargin, apply_suggested_price: !hasPrice, custom_price: match?.price || undefined };
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
    // Vendedor solo puede actualizar nombre, descripción e imagen
    if (this.PERMISSIONS.canEditInventoryBasic(this.currentRole) && this.editingId) {
      this.savePlantVendor(); return;
    }
    const req = this.editingId ? this.plantService.updatePlant(this.editingId, this.plantForm) : this.plantService.createPlant(this.clientSlug, this.plantForm);
    req.subscribe({ next: () => { this.resetForm(); this.showForm = false; this.loadData(); }, error: e => console.error(e) });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    this.showForm = true;
    this.activeTab = 'inventario';
    this.cdr.detectChanges();
    setTimeout(() => {
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderIcons();
    }, 100);
  }

  editPlantVendor(plant: Plant) {
    // Vendedor solo puede editar nombre, descripción e imagen
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    this.showForm = true;
    this.activeTab = 'inventario';
    this.cdr.detectChanges();
    setTimeout(() => {
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderIcons();
    }, 100);
  }

  savePlantVendor() {
    if (!this.plantForm.name || !this.editingId) return;
    this.plantService.vendorUpdatePlant(this.editingId, {
      name: this.plantForm.name,
      description: this.plantForm.description || '',
      image_url: this.plantForm.image_url || ''
    }).subscribe({
      next: () => { this.resetForm(); this.showForm = false; this.loadData(); },
      error: e => console.error(e)
    });
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