import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlantService, Client, Plant, SalesReport } from '../services/plant.service';
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

declare const lucide: any;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent],
  styles: [`
    .metric-card { background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;text-align:center;box-shadow:0 4px 12px rgba(16,35,25,0.04); }
    .metric-card.clickable { cursor:pointer;transition:all 0.15s; }
    .metric-card.clickable:hover { transform:translateY(-2px);box-shadow:0 8px 20px rgba(16,35,25,0.1);border-color:#14452F; }
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
    .restock-mobile { display: block; }
    .restock-desktop { display: none; }
    @media (min-width: 768px) { .restock-mobile { display: none; } .restock-desktop { display: block; } }
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
    .period-pill { padding:6px 14px;border-radius:99px;font-size:0.8rem;font-weight:600;cursor:pointer;border:1px solid #dfe7dd;background:#f4f8f1;color:#516052;transition:all 0.15s; }
    .period-pill.active { background:#14452F;color:white;border-color:#14452F; }
    .inv-filter-pill { padding:7px 14px;border-radius:99px;font-size:0.8rem;font-weight:600;cursor:pointer;border:1px solid #dfe7dd;background:#f4f8f1;color:#516052;transition:all 0.15s; }
    .nav-tab { display:flex;align-items:center;gap:6px;padding:10px 16px;border:none;background:none;color:rgba(255,255,255,0.6);font-size:0.85rem;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap; }
    .nav-tab.active { color:white;border-bottom-color:white; }
    .nav-tab:hover { color:white; }
  `],
  template: `
    <!-- HEADER con tabs -->
    <header style="background:#14452F;color:white;position:sticky;top:0;z-index:100;box-shadow:0 4px 20px rgba(20,69,47,0.18);">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px 0;">
        <button (click)="goToPublic()" style="background:none;border:none;color:rgba(255,255,255,0.75);cursor:pointer;font-size:0.82rem;font-weight:500;display:flex;align-items:center;gap:5px;padding:0;">
          <i data-lucide="arrow-left" style="width:15px;height:15px;"></i>
          Ver tienda
        </button>
        <div style="text-align:center;">
          <div style="font-size:0.95rem;font-weight:700;color:white;">Demo Garden PR</div>
        </div>
        <button (click)="logout()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
          <i data-lucide="log-out" style="width:13px;height:13px;"></i>
          Salir
        </button>
      </div>
      <nav style="display:flex;overflow-x:auto;padding:0 12px;scrollbar-width:none;gap:2px;">
        <button class="nav-tab" [class.active]="activeTab==='dashboard'" (click)="setTab('dashboard')">
          <i data-lucide="layout-dashboard" style="width:15px;height:15px;"></i>Dashboard
        </button>
        <button class="nav-tab" [class.active]="activeTab==='ventas'" (click)="setTab('ventas')">
          <i data-lucide="bar-chart-2" style="width:15px;height:15px;"></i>Ventas
        </button>
        <button class="nav-tab" [class.active]="activeTab==='inventario'" (click)="setTab('inventario')">
          <i data-lucide="package" style="width:15px;height:15px;"></i>Inventario
        </button>
        <button class="nav-tab" [class.active]="activeTab==='pos'" (click)="setTab('pos')">
          <i data-lucide="upload" style="width:15px;height:15px;"></i>Importar POS
        </button>
      </nav>
    </header>

    <div style="max-width:1100px;margin:0 auto;padding:20px 16px 60px;">

      <!-- ── TAB: DASHBOARD ── -->
      <div *ngIf="activeTab==='dashboard'">
        <h2 class="section-title">Dashboard</h2>
        <p class="section-sub">Resumen del inventario en tiempo real.</p>

        <!-- Métricas clickeables -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:11px;margin-bottom:14px;">

          <div class="metric-card clickable" (click)="goToInventory('all')" title="Ver todas las plantas">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">
              <i data-lucide="leaf" style="width:20px;height:20px;color:#1f7a4d;"></i>
            </div>
            <div style="font-size:1.8rem;font-weight:800;color:#102319;line-height:1;">{{ plants.length }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Total Plantas</div>
            <div style="font-size:0.65rem;color:#9ca3af;margin-top:3px;">Ver todas →</div>
          </div>

          <div class="metric-card clickable" (click)="goToInventory('all')" title="Ver inventario">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">
              <i data-lucide="boxes" style="width:20px;height:20px;color:#1f7a4d;"></i>
            </div>
            <div style="font-size:1.8rem;font-weight:800;color:#1f7a4d;line-height:1;">{{ totalStock }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Total en Stock</div>
            <div style="font-size:0.65rem;color:#9ca3af;margin-top:3px;">Ver inventario →</div>
          </div>

          <div class="metric-card clickable" style="border-color:#fef3c7;" (click)="goToInventory('low')" title="Ver plantas con bajo stock">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">
              <i data-lucide="alert-triangle" style="width:20px;height:20px;color:#d97706;"></i>
            </div>
            <div style="font-size:1.8rem;font-weight:800;color:#d97706;line-height:1;">{{ lowStockPlants.length }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Bajo Stock</div>
            <div style="font-size:0.65rem;color:#d97706;margin-top:3px;">Ver plantas →</div>
          </div>

          <div class="metric-card clickable" style="border-color:#fee2e2;" (click)="goToInventory('out')" title="Ver plantas sin stock">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">
              <i data-lucide="x-circle" style="width:20px;height:20px;color:#dc2626;"></i>
            </div>
            <div style="font-size:1.8rem;font-weight:800;color:#dc2626;line-height:1;">{{ outOfStockPlants.length }}</div>
            <div style="font-size:0.72rem;color:#516052;font-weight:600;margin-top:5px;">Sin Stock</div>
            <div style="font-size:0.65rem;color:#dc2626;margin-top:3px;">Ver plantas →</div>
          </div>

          <div class="metric-card clickable" style="background:linear-gradient(135deg,#102319,#1f7a4d);border:none;" (click)="setTab('ventas')" title="Ver reporte de ventas">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">
              <i data-lucide="trending-up" style="width:20px;height:20px;color:rgba(255,255,255,0.8);"></i>
            </div>
            <div style="font-size:1.3rem;font-weight:800;color:white;line-height:1;">\${{ estimatedInventoryValue | number:'1.0-0' }}</div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.75);font-weight:600;margin-top:5px;">Valor Estimado</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.5);margin-top:3px;">Ver ventas →</div>
          </div>
        </div>

        <!-- Donut + Bajo stock -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-bottom:14px;">
          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 16px 0;color:#102319;font-size:0.9rem;font-weight:700;display:flex;align-items:center;gap:7px;">
              <i data-lucide="pie-chart" style="width:16px;height:16px;color:#14452F;"></i>
              Inventario por categoría
            </h3>
            <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">
              <svg width="130" height="130" viewBox="0 0 130 130" style="flex-shrink:0;">
                <ng-container *ngFor="let seg of donutSegments">
                  <circle cx="65" cy="65" r="44" fill="none" [attr.stroke]="seg.color" stroke-width="22"
                    [attr.stroke-dasharray]="seg.dashArray" [attr.stroke-dashoffset]="seg.dashOffset"
                    style="transform:rotate(-90deg);transform-origin:65px 65px;"></circle>
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

          <div style="background:white;border:1px solid #eef1ec;border-radius:20px;padding:20px;box-shadow:0 4px 12px rgba(16,35,25,0.04);">
            <h3 style="margin:0 0 4px 0;color:#102319;font-size:0.9rem;font-weight:700;display:flex;align-items:center;gap:7px;">
              <i data-lucide="alert-triangle" style="width:16px;height:16px;color:#d97706;"></i>
              Productos con bajo stock
            </h3>
            <p style="margin:0 0 12px 0;color:#516052;font-size:0.75rem;">≤5 unidades disponibles</p>
            <div *ngIf="lowStockPlants.length===0" style="text-align:center;padding:14px;color:#aaa;font-size:0.85rem;">✅ Inventario bien surtido</div>
            <div *ngFor="let p of lowStockPlants" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f4f4f4;cursor:pointer;" (click)="goToInventory('low')">
              <div style="width:40px;height:40px;border-radius:10px;overflow:hidden;background:#f4f8f1;flex-shrink:0;">
                <img *ngIf="p.image_url" [src]="p.image_url" style="width:100%;height:100%;object-fit:cover;">
                <div *ngIf="!p.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><i data-lucide="sprout" style="width:18px;height:18px;color:#9ca3af;"></i></div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;color:#102319;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div>
                <div style="color:#dc2626;font-size:0.74rem;font-weight:600;">{{ p.stock }} {{ p.stock===1?'unidad':'unidades' }}</div>
              </div>
              <div style="font-weight:700;color:#1f7a4d;font-size:0.88rem;">\${{ p.price }}</div>
            </div>
          </div>
        </div>

        <!-- Accesos rápidos -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
          <button (click)="setTab('ventas')" style="background:white;border:1px solid #eef1ec;border-radius:16px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;" onmouseover="this.style.borderColor='#14452F'" onmouseout="this.style.borderColor='#eef1ec'">
            <div style="background:#f0fdf4;border-radius:10px;padding:8px;flex-shrink:0;"><i data-lucide="bar-chart-2" style="width:18px;height:18px;color:#14452F;"></i></div>
            <div><div style="font-weight:700;color:#102319;font-size:0.85rem;">Ver ventas</div><div style="font-size:0.72rem;color:#9ca3af;">Reporte POS</div></div>
          </button>
          <button (click)="goToInventory('all')" style="background:white;border:1px solid #eef1ec;border-radius:16px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;" onmouseover="this.style.borderColor='#14452F'" onmouseout="this.style.borderColor='#eef1ec'">
            <div style="background:#f0fdf4;border-radius:10px;padding:8px;flex-shrink:0;"><i data-lucide="package" style="width:18px;height:18px;color:#14452F;"></i></div>
            <div><div style="font-weight:700;color:#102319;font-size:0.85rem;">Inventario</div><div style="font-size:0.72rem;color:#9ca3af;">{{ plants.length }} plantas</div></div>
          </button>
          <button (click)="setTab('pos')" style="background:white;border:1px solid #eef1ec;border-radius:16px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;" onmouseover="this.style.borderColor='#14452F'" onmouseout="this.style.borderColor='#eef1ec'">
            <div style="background:#f0fdf4;border-radius:10px;padding:8px;flex-shrink:0;"><i data-lucide="upload" style="width:18px;height:18px;color:#14452F;"></i></div>
            <div><div style="font-weight:700;color:#102319;font-size:0.85rem;">Importar POS</div><div style="font-size:0.72rem;color:#9ca3af;">Subir ventas</div></div>
          </button>
          <button (click)="goToInventory('all'); showForm=true" style="background:#14452F;border:none;border-radius:16px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:10px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px;flex-shrink:0;"><i data-lucide="plus-circle" style="width:18px;height:18px;color:white;"></i></div>
            <div><div style="font-weight:700;color:white;font-size:0.85rem;">Nueva planta</div><div style="font-size:0.72rem;color:rgba(255,255,255,0.6);">Agregar al catálogo</div></div>
          </button>
        </div>
      </div>

      <!-- ── TAB: VENTAS ── -->
      <div *ngIf="activeTab==='ventas'">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <h2 class="section-title">Reporte de Ventas</h2>
            <p style="margin:4px 0 0;color:#516052;font-size:0.85rem;">Ventas importadas desde el POS.</p>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button *ngFor="let p of salesPeriods" class="period-pill" [class.active]="selectedSalesPeriod===p.value" (click)="changeSalesPeriod(p.value)">{{ p.label }}</button>
          </div>
        </div>

        <div *ngIf="salesLoading" style="text-align:center;padding:30px;color:#516052;">📊 Cargando reporte...</div>

        <ng-container *ngIf="!salesLoading && salesReport">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px;">
            <div class="metric-card" style="border-color:#dcfce7;">
              <div style="display:flex;justify-content:center;margin-bottom:8px;"><i data-lucide="dollar-sign" style="width:18px;height:18px;color:#15803d;"></i></div>
              <div style="font-size:1.5rem;font-weight:800;color:#15803d;line-height:1;">\${{ salesReport.summary.total_revenue | number:'1.0-0' }}</div>
              <div style="font-size:0.7rem;color:#516052;font-weight:600;margin-top:5px;">Ventas Totales</div>
            </div>
            <div class="metric-card">
              <div style="display:flex;justify-content:center;margin-bottom:8px;"><i data-lucide="trending-up" style="width:18px;height:18px;color:#1f7a4d;"></i></div>
              <div style="font-size:1.5rem;font-weight:800;color:#1f7a4d;line-height:1;">\${{ salesReport.summary.total_profit | number:'1.0-0' }}</div>
              <div style="font-size:0.7rem;color:#516052;font-weight:600;margin-top:5px;">Ganancia Neta</div>
            </div>
            <div class="metric-card" style="border-color:#fef3c7;">
              <div style="display:flex;justify-content:center;margin-bottom:8px;"><i data-lucide="percent" style="width:18px;height:18px;color:#d97706;"></i></div>
              <div style="font-size:1.5rem;font-weight:800;color:#d97706;line-height:1;">{{ salesReport.summary.margin_pct | number:'1.0-0' }}%</div>
              <div style="font-size:0.7rem;color:#516052;font-weight:600;margin-top:5px;">Margen</div>
            </div>
            <div class="metric-card">
              <div style="display:flex;justify-content:center;margin-bottom:8px;"><i data-lucide="shopping-bag" style="width:18px;height:18px;color:#102319;"></i></div>
              <div style="font-size:1.5rem;font-weight:800;color:#102319;line-height:1;">{{ salesReport.summary.total_units }}</div>
              <div style="font-size:0.7rem;color:#516052;font-weight:600;margin-top:5px;">Unidades Vendidas</div>
            </div>
            <div class="metric-card">
              <div style="display:flex;justify-content:center;margin-bottom:8px;"><i data-lucide="file-check" style="width:18px;height:18px;color:#516052;"></i></div>
              <div style="font-size:1.5rem;font-weight:800;color:#516052;line-height:1;">{{ salesReport.summary.total_transactions }}</div>
              <div style="font-size:0.7rem;color:#516052;font-weight:600;margin-top:5px;">Archivos importados</div>
            </div>
          </div>

          <div *ngIf="salesReport.summary.total_units===0" style="text-align:center;padding:28px;background:#f9fdf9;border-radius:14px;color:#9ca3af;font-size:0.88rem;margin-bottom:18px;">
            📦 No hay ventas registradas para este período.
          </div>

          <ng-container *ngIf="salesReport.summary.total_units > 0">
            <div style="background:#f9fdf9;border-radius:16px;padding:18px;margin-bottom:18px;" *ngIf="salesReport.chart_data.length > 0">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;color:#102319;font-size:0.88rem;font-weight:700;display:flex;align-items:center;gap:6px;">
                  <i data-lucide="bar-chart-2" style="width:15px;height:15px;color:#14452F;"></i>
                  Ventas diarias — últimos 14 días
                </h3>
                <div style="display:flex;gap:12px;">
                  <div style="display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:#14452F;display:inline-block;"></span><span style="font-size:0.72rem;color:#516052;">Ingresos ($)</span></div>
                  <div style="display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:#4caf78;display:inline-block;"></span><span style="font-size:0.72rem;color:#516052;">Unidades</span></div>
                </div>
              </div>
              <div style="display:flex;align-items:flex-end;gap:6px;height:140px;overflow-x:auto;padding-bottom:4px;">
                <div *ngFor="let d of salesReport.chart_data" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;flex:1;min-width:32px;height:100%;">
                  <div [style.height.px]="getBarPxRevenue(d.revenue)" style="width:100%;background:#14452F;border-radius:5px 5px 0 0;opacity:0.85;" [title]="'$'+d.revenue"></div>
                  <div [style.height.px]="getBarPxUnits(d.units)" style="width:100%;background:#4caf78;border-radius:5px 5px 0 0;" [title]="d.units+' u.'"></div>
                  <div style="font-size:0.6rem;color:#9ca3af;white-space:nowrap;margin-top:3px;">{{ formatChartDay(d.day) }}</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-top:6px;overflow-x:auto;">
                <div *ngFor="let d of salesReport.chart_data" style="flex:1;min-width:32px;text-align:center;">
                  <div style="font-size:0.62rem;color:#14452F;font-weight:700;">\${{ d.revenue | number:'1.0-0' }}</div>
                  <div style="font-size:0.58rem;color:#4caf78;font-weight:600;">{{ d.units }}u</div>
                </div>
              </div>
            </div>

            <div style="margin-bottom:18px;" *ngIf="salesReport.top_plants.length > 0">
              <h3 style="margin:0 0 12px 0;color:#102319;font-size:0.88rem;font-weight:700;display:flex;align-items:center;gap:6px;">
                <i data-lucide="trophy" style="width:15px;height:15px;color:#d97706;"></i>
                Top plantas más vendidas
              </h3>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
                <div *ngFor="let p of salesReport.top_plants; let i = index" style="display:flex;align-items:center;gap:10px;padding:12px;background:#f9fdf9;border-radius:14px;border:1px solid #eef1ec;">
                  <div style="font-size:1rem;font-weight:800;color:#9ca3af;width:20px;text-align:center;flex-shrink:0;">#{{ i+1 }}</div>
                  <div style="width:38px;height:38px;border-radius:10px;overflow:hidden;background:#f4f8f1;flex-shrink:0;">
                    <img *ngIf="p.image_url" [src]="p.image_url" style="width:100%;height:100%;object-fit:cover;">
                    <div *ngIf="!p.image_url" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><i data-lucide="sprout" style="width:16px;height:16px;color:#9ca3af;"></i></div>
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#102319;font-size:0.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.name }}</div>
                    <div style="font-size:0.72rem;color:#516052;">{{ p.units_sold }} u. · <span style="color:#15803d;font-weight:600;">\${{ p.revenue | number:'1.0-0' }}</span></div>
                    <div style="font-size:0.68rem;color:#1f7a4d;font-weight:600;" *ngIf="p.profit > 0">gan. \${{ p.profit | number:'1.0-0' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="getDailySummary().length > 0">
              <h3 style="margin:0 0 12px 0;color:#102319;font-size:0.88rem;font-weight:700;display:flex;align-items:center;gap:6px;">
                <i data-lucide="calendar" style="width:15px;height:15px;color:#14452F;"></i>
                Historial por día
              </h3>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div *ngFor="let day of getDailySummary()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f9fdf9;border-radius:12px;border:1px solid #eef1ec;flex-wrap:wrap;gap:8px;">
                  <div style="font-weight:700;color:#102319;font-size:0.88rem;display:flex;align-items:center;gap:6px;">
                    <i data-lucide="calendar-days" style="width:14px;height:14px;color:#9ca3af;"></i>{{ day.date }}
                  </div>
                  <div style="display:flex;gap:20px;flex-wrap:wrap;">
                    <div style="text-align:center;"><div style="font-size:0.68rem;color:#9ca3af;font-weight:600;text-transform:uppercase;">Unidades</div><div style="font-weight:700;color:#102319;">{{ day.units }}</div></div>
                    <div style="text-align:center;"><div style="font-size:0.68rem;color:#9ca3af;font-weight:600;text-transform:uppercase;">Ingresos</div><div style="font-weight:700;color:#15803d;">\${{ day.revenue | number:'1.0-0' }}</div></div>
                    <div style="text-align:center;"><div style="font-size:0.68rem;color:#9ca3af;font-weight:600;text-transform:uppercase;">Productos</div><div style="font-weight:700;color:#516052;">{{ day.items }}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>
      </div>

      <!-- ── TAB: INVENTARIO ── -->
      <div *ngIf="activeTab==='inventario'">

        <!-- AI Restock -->
        <div style="background:linear-gradient(135deg,#0d3320,#1a5c38 60%,#236b45);border-radius:22px;padding:26px;margin-bottom:22px;box-shadow:0 16px 48px rgba(15,50,30,0.2);position:relative;overflow:hidden;">
          <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:rgba(255,255,255,0.04);border-radius:50%;pointer-events:none;"></div>
          <div style="position:relative;z-index:1;">
            <span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:white;font-size:0.68rem;font-weight:800;letter-spacing:1.5px;padding:4px 11px;border-radius:99px;display:inline-flex;align-items:center;gap:5px;margin-bottom:12px;">
              <i data-lucide="sparkles" style="width:12px;height:12px;"></i> ACTUALIZAR INVENTARIO
            </span>
            <h2 style="color:white;font-size:1.45rem;font-weight:800;margin:0 0 7px;">Actualizar con Factura</h2>
            <p style="color:rgba(255,255,255,0.7);font-size:0.82rem;margin:0 0 16px;">Sube una factura del suplidor y el AI detecta plantas, cantidades y costos.</p>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
              <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;">
                <span style="color:rgba(255,255,255,0.75);font-size:0.8rem;font-weight:600;white-space:nowrap;">Margen deseado:</span>
                <input type="number" [(ngModel)]="desiredMargin" min="1" max="99" style="width:60px;padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);color:white;font-size:0.88rem;font-weight:700;text-align:center;outline:none;">
                <span style="color:rgba(255,255,255,0.75);font-size:0.8rem;">%</span>
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.08);border:2px dashed rgba(255,255,255,0.2);border-radius:14px;padding:16px;">
              <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
                <label style="display:flex;align-items:center;gap:7px;background:white;color:#102319;border-radius:10px;padding:9px 16px;font-weight:700;font-size:0.85rem;cursor:pointer;white-space:nowrap;">
                  <i data-lucide="upload" style="width:15px;height:15px;"></i>
                  Subir factura
                  <input type="file" (change)="onInvoiceSelected($event)" accept="image/*,.pdf" style="display:none;">
                </label>
                <span style="color:rgba(255,255,255,0.55);font-size:0.8rem;flex:1;min-width:90px;">{{ selectedInvoice ? '📎 '+selectedInvoice.name : 'JPG, PNG o PDF' }}</span>
                <button [disabled]="!selectedInvoice||invoiceLoading" (click)="analyzeInvoice()"
                  style="padding:10px 20px;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.85rem;"
                  [style.background]="(!selectedInvoice||invoiceLoading)?'rgba(255,255,255,0.12)':'#4ade80'"
                  [style.color]="(!selectedInvoice||invoiceLoading)?'rgba(255,255,255,0.35)':'#052e16'">
                  {{ invoiceLoading ? '⏳ Analizando...' : '🤖 Analizar con AI' }}
                </button>
              </div>
            </div>

            <div *ngIf="restockItems.length" style="background:white;border-radius:16px;margin-top:16px;overflow:hidden;">
              <div style="padding:16px 20px 12px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;color:#102319;font-size:0.95rem;font-weight:700;">Plantas detectadas</h3>
                <span style="font-size:0.75rem;color:#516052;">{{ restockItems.length }} item(s)</span>
              </div>
              <div class="restock-mobile">
                <div *ngFor="let item of restockItems; let i = index" style="padding:16px;border-bottom:1px solid #f4f4f4;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <input type="text" [(ngModel)]="item.plant_name" style="flex:1;padding:8px 10px;border:1px solid #dfe7dd;border-radius:10px;font-size:0.88rem;outline:none;font-weight:600;">
                    <button (click)="removeRestockItem(i)" style="background:#fff0f0;border:none;color:#9b1c1c;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;flex-shrink:0;">✕</button>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
                    <div><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;">Cantidad</div><input type="number" [(ngModel)]="item.quantity" min="1" style="width:100%;padding:7px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.88rem;outline:none;box-sizing:border-box;"></div>
                    <div><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;">Costo unit.</div><div style="display:flex;align-items:center;gap:2px;"><span style="color:#9ca3af;font-size:0.78rem;">$</span><input type="number" [(ngModel)]="item.unit_cost" step="0.01" min="0" style="width:100%;padding:7px 6px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.88rem;outline:none;box-sizing:border-box;"></div></div>
                    <div><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;">Total</div><div style="padding:7px 8px;background:#f4f8f1;border-radius:8px;font-size:0.88rem;font-weight:600;color:#516052;">\${{ (item.unit_cost*item.quantity)|number:'1.2-2' }}</div></div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <div><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;">Precio venta</div><div style="display:flex;align-items:center;gap:2px;"><span style="color:#9ca3af;font-size:0.78rem;">$</span><input type="number" [(ngModel)]="item.current_sale_price" step="0.01" min="0" placeholder="0.00" style="width:100%;padding:7px 6px;border-radius:8px;font-size:0.88rem;outline:none;box-sizing:border-box;" [style.border]="'1px solid '+(!item.current_sale_price&&!item.apply_suggested_price?'#fca5a5':'#dfe7dd')"></div></div>
                    <div><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;">Margen deseado</div><div style="display:flex;align-items:center;gap:4px;"><input type="number" [(ngModel)]="item.row_margin" min="1" max="99" style="width:60px;padding:7px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.88rem;outline:none;text-align:center;"><span style="color:#9ca3af;font-size:0.82rem;">%</span></div></div>
                  </div>
                  <div style="display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:10px;background:#f9fdf9;border-radius:10px;">
                    <div style="flex:1;min-width:100px;"><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Precio sugerido</div><div style="font-weight:700;color:#1f7a4d;font-size:0.95rem;">\${{ getRowSuggestedPrice(item)|number:'1.2-2' }}</div><div class="tag-suggested" style="display:inline-block;margin-top:2px;">{{ item.row_margin }}% margen</div></div>
                    <div *ngIf="getEffectivePrice(item)>0" style="flex:1;min-width:100px;"><div style="font-size:0.65rem;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Ganancia</div><div [class]="getRowProfitClass(item)" style="font-size:0.95rem;">\${{ getRowProfit(item)|number:'1.2-2' }}</div><div style="font-size:0.72rem;color:#516052;">{{ getRowMargin(item)|number:'1.0-1' }}%</div><span [class]="getRowMarginTag(item)">{{ getRowMarginLabel(item) }}</span></div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><input type="checkbox" [(ngModel)]="item.apply_suggested_price" [id]="'chk-'+i" style="width:18px;height:18px;accent-color:#14452F;cursor:pointer;"><label [for]="'chk-'+i" style="font-size:0.78rem;color:#102319;font-weight:600;cursor:pointer;">Usar sugerido</label></div>
                  </div>
                </div>
              </div>
              <div class="restock-desktop" style="overflow-x:auto;">
                <table class="restock-table">
                  <thead><tr><th>Planta</th><th>Cant.</th><th>Costo unit.</th><th>Costo total</th><th>Precio venta</th><th>Margen</th><th>Precio sugerido</th><th>Ganancia</th><th>Usar sugerido</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let item of restockItems; let i = index">
                      <td><input type="text" [(ngModel)]="item.plant_name" style="width:130px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;"></td>
                      <td><input type="number" [(ngModel)]="item.quantity" min="1" style="width:55px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;"></td>
                      <td><div style="display:flex;align-items:center;gap:3px;"><span style="color:#9ca3af;font-size:0.78rem;">$</span><input type="number" [(ngModel)]="item.unit_cost" step="0.01" min="0" style="width:65px;padding:6px 8px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;"></div></td>
                      <td style="color:#516052;font-weight:600;white-space:nowrap;">\${{ (item.unit_cost*item.quantity)|number:'1.2-2' }}</td>
                      <td><div style="display:flex;align-items:center;gap:3px;"><span style="color:#9ca3af;font-size:0.78rem;">$</span><input type="number" [(ngModel)]="item.current_sale_price" step="0.01" min="0" placeholder="Precio venta" style="width:70px;padding:6px 8px;border-radius:8px;font-size:0.82rem;outline:none;" [style.border]="'1px solid '+(!item.current_sale_price&&!item.apply_suggested_price?'#fca5a5':'#dfe7dd')"></div></td>
                      <td><div style="display:flex;align-items:center;gap:3px;"><input type="number" [(ngModel)]="item.row_margin" min="1" max="99" style="width:46px;padding:6px;border:1px solid #dfe7dd;border-radius:8px;font-size:0.82rem;outline:none;text-align:center;"><span style="color:#9ca3af;font-size:0.78rem;">%</span></div></td>
                      <td style="white-space:nowrap;"><span style="font-weight:700;color:#1f7a4d;">\${{ getRowSuggestedPrice(item)|number:'1.2-2' }}</span><div class="tag-suggested" style="margin-top:2px;display:inline-block;">{{ item.row_margin }}% margen</div></td>
                      <td style="white-space:nowrap;"><ng-container *ngIf="getEffectivePrice(item)>0"><div [class]="getRowProfitClass(item)">\${{ getRowProfit(item)|number:'1.2-2' }}</div><div style="font-size:0.72rem;color:#516052;">{{ getRowMargin(item)|number:'1.0-1' }}%</div><span [class]="getRowMarginTag(item)">{{ getRowMarginLabel(item) }}</span></ng-container><span *ngIf="getEffectivePrice(item)<=0" style="color:#aaa;font-size:0.78rem;">—</span></td>
                      <td style="text-align:center;"><input type="checkbox" [(ngModel)]="item.apply_suggested_price" style="width:16px;height:16px;accent-color:#14452F;cursor:pointer;"></td>
                      <td><button (click)="removeRestockItem(i)" style="background:#fff0f0;border:none;color:#9b1c1c;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700;font-size:0.8rem;">✕</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="padding:14px 20px;background:#f9fdf9;border-top:1px solid #eef1ec;">
                <span style="font-size:0.8rem;color:#516052;"><span style="font-weight:700;color:#102319;">Costo total:</span> \${{ totalInvoiceCost|number:'1.2-2' }}</span>
              </div>
              <div style="padding:14px 20px 18px;display:flex;flex-wrap:wrap;gap:10px;">
                <button (click)="confirmRestock()" class="btn-primary" style="flex:1;min-width:160px;">✅ Confirmar actualización</button>
                <button (click)="cancelInvoice()" class="btn-secondary" style="flex:1;min-width:130px;">Cancelar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Header inventario + filtros -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div>
            <h2 class="section-title">Inventario</h2>
            <p class="section-sub">{{ filteredInventory.length }} de {{ plants.length }} plantas</p>
          </div>
          <button (click)="showForm=!showForm" class="btn-primary" style="display:flex;align-items:center;gap:6px;padding:10px 18px;">
            <i data-lucide="plus" style="width:16px;height:16px;"></i>
            {{ showForm ? 'Cerrar' : 'Nueva planta' }}
          </button>
        </div>

        <!-- Pills de filtro -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <button class="inv-filter-pill"
            [style.background]="inventoryFilter==='all' ? '#14452F' : '#f4f8f1'"
            [style.color]="inventoryFilter==='all' ? 'white' : '#516052'"
            [style.borderColor]="inventoryFilter==='all' ? '#14452F' : '#dfe7dd'"
            (click)="inventoryFilter='all'">
            Todas ({{ plants.length }})
          </button>
          <button class="inv-filter-pill"
            [style.background]="inventoryFilter==='low' ? '#d97706' : '#fef3c7'"
            [style.color]="inventoryFilter==='low' ? 'white' : '#92400e'"
            [style.borderColor]="inventoryFilter==='low' ? '#d97706' : '#fde68a'"
            (click)="inventoryFilter='low'">
            ⚠️ Bajo stock ({{ lowStockPlants.length }})
          </button>
          <button class="inv-filter-pill"
            [style.background]="inventoryFilter==='out' ? '#dc2626' : '#fee2e2'"
            [style.color]="inventoryFilter==='out' ? 'white' : '#991b1b'"
            [style.borderColor]="inventoryFilter==='out' ? '#dc2626' : '#fecaca'"
            (click)="inventoryFilter='out'">
            ❌ Sin stock ({{ outOfStockPlants.length }})
          </button>
        </div>

        <!-- Formulario colapsable -->
        <div *ngIf="showForm" id="plant-form" style="background:white;border-radius:22px;padding:24px;border:1px solid #eef1ec;box-shadow:0 4px 16px rgba(16,35,25,0.04);margin-bottom:18px;">
          <h2 class="section-title">{{ editingId ? '✏️ Editar Planta' : '🌱 Nueva Planta' }}</h2>
          <p class="section-sub">{{ editingId ? 'Modifica los datos.' : 'Agrega una nueva planta al catálogo.' }}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:13px;">
            <div class="form-group"><label class="form-label">Nombre</label><input type="text" [(ngModel)]="plantForm.name" class="form-input" placeholder="Ej. Monstera Deliciosa"></div>
            <div class="form-group"><label class="form-label">Categoría</label>
              <select [(ngModel)]="plantForm.category" class="form-input">
                <option value="" disabled>Selecciona una categoría</option>
                <option *ngFor="let cat of PLANT_CATEGORIES" [value]="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Precio de venta</label><input type="number" [(ngModel)]="plantForm.price" class="form-input" placeholder="Precio público"></div>
            <div class="form-group"><label class="form-label">Costo de compra</label><input type="number" [(ngModel)]="plantForm.cost_price" class="form-input" placeholder="Costo mayorista"></div>
            <div class="form-group"><label class="form-label">Cantidad disponible</label><input type="number" [(ngModel)]="plantForm.stock" class="form-input" placeholder="Stock"></div>
            <div class="form-group">
              <label class="form-label">Imagen</label>
              <div style="position:relative;border:2px dashed #dfe7dd;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:46px;background:#fafdf8;cursor:pointer;">
                <input type="file" accept="image/*" (change)="uploadPlantImage($event)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
                <span style="color:#516052;font-weight:600;font-size:0.85rem;pointer-events:none;">{{ imageUploading ? '⏳ Subiendo...' : plantForm.image_url ? '✅ Imagen subida' : '📷 Subir imagen' }}</span>
              </div>
            </div>
            <div class="form-group"><label class="form-label">Luz</label><input type="text" [(ngModel)]="plantForm.light" class="form-input" placeholder="Ej. Sol parcial"></div>
            <div class="form-group"><label class="form-label">Agua / Riego</label><input type="text" [(ngModel)]="plantForm.water" class="form-input" placeholder="Ej. Moderada, Poca"></div>
            <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Descripción</label><textarea [(ngModel)]="plantForm.description" class="form-input" style="min-height:76px;resize:vertical;" placeholder="Descripción breve..."></textarea></div>
            <div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;">
              <input type="checkbox" [(ngModel)]="plantForm.is_featured" id="featured" style="width:17px;height:17px;accent-color:#14452F;">
              <label for="featured" style="color:#102319;font-weight:500;cursor:pointer;font-size:0.9rem;">Destacar planta</label>
            </div>
            <div style="grid-column:1/-1;display:flex;gap:11px;flex-wrap:wrap;margin-top:4px;">
              <button (click)="savePlant()" class="btn-primary" style="flex:1;min-width:130px;">{{ editingId ? '✅ Actualizar' : '➕ Crear Planta' }}</button>
              <button (click)="resetForm()" class="btn-secondary" style="flex:1;min-width:130px;">Limpiar</button>
            </div>
          </div>
        </div>

        <!-- Lista filtrada -->
        <div *ngIf="inventoryFilter==='low' && lowStockPlants.length===0" style="text-align:center;padding:28px;background:#fef3c7;border-radius:14px;color:#92400e;font-size:0.88rem;">
          ✅ No hay plantas con bajo stock en este momento.
        </div>
        <div *ngIf="inventoryFilter==='out' && outOfStockPlants.length===0" style="text-align:center;padding:28px;background:#fee2e2;border-radius:14px;color:#991b1b;font-size:0.88rem;">
          ✅ No hay plantas sin stock en este momento.
        </div>

        <div *ngIf="loading" style="text-align:center;padding:40px;color:#516052;">🌱 Cargando...</div>
        <div class="admin-inventory" *ngIf="!loading">
          <app-plant-card *ngFor="let p of filteredInventory" [plant]="p" [adminMode]="true" [client]="client"
            (onEdit)="editPlant($event)" (onRemove)="removePlant($event)">
          </app-plant-card>
          <div *ngIf="filteredInventory.length===0 && inventoryFilter==='all'" style="text-align:center;padding:28px;color:#888;font-size:0.9rem;">No hay plantas aún.</div>
        </div>
      </div>

      <!-- ── TAB: IMPORTAR POS ── -->
      <div *ngIf="activeTab==='pos'">
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">
          <div style="background:#f4f8f1;border-radius:14px;padding:12px;flex-shrink:0;">
            <i data-lucide="file-up" style="width:24px;height:24px;color:#14452F;"></i>
          </div>
          <div>
            <h2 class="section-title">Importar ventas del día</h2>
            <p style="margin:4px 0 0;color:#516052;font-size:0.85rem;">Sube el reporte diario de ventas de tu POS para descontar inventario automáticamente.</p>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:0.78rem;">Exporta las ventas desde tu POS, súbelas aquí y el sistema descuenta las cantidades del inventario.</p>
          </div>
        </div>

        <div style="border:2px dashed #dfe7dd;border-radius:14px;padding:16px;background:#fafdf8;margin-bottom:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
            <label style="display:flex;align-items:center;gap:7px;background:#14452F;color:white;border-radius:10px;padding:9px 16px;font-weight:700;font-size:0.85rem;cursor:pointer;white-space:nowrap;">
              <i data-lucide="upload" style="width:15px;height:15px;"></i>
              Subir archivo
              <input type="file" (change)="onPosFileSelected($event)" accept=".csv,.xlsx,.xls" style="display:none;">
            </label>
            <span style="color:#516052;font-size:0.82rem;flex:1;min-width:100px;">{{ posFile ? '📎 '+posFile.name : 'CSV o Excel del POS' }}</span>
            <button [disabled]="!posFile||posLoading" (click)="analyzePosFile()"
              style="padding:9px 18px;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.85rem;"
              [style.background]="(!posFile||posLoading)?'#e5e7e5':'#1f7a4d'"
              [style.color]="(!posFile||posLoading)?'#9ca3af':'white'">
              {{ posLoading ? '⏳ Analizando...' : '📊 Analizar ventas' }}
            </button>
          </div>
        </div>

        <div *ngIf="posError" style="background:#fff0f0;border:1px solid #fad5d5;border-radius:12px;padding:12px 16px;margin-bottom:14px;color:#9b1c1c;font-size:0.85rem;">⚠️ {{ posError }}</div>

        <div *ngIf="posImportSuccessMsg" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;margin-bottom:14px;color:#15803d;font-size:0.88rem;font-weight:600;display:flex;align-items:center;gap:8px;">
          <i data-lucide="check-circle" style="width:18px;height:18px;"></i>
          {{ posImportSuccessMsg }}
        </div>

        <div *ngIf="posItems.length" style="overflow:hidden;border-radius:14px;border:1px solid #eef1ec;">
          <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <span style="font-weight:700;color:#102319;font-size:0.9rem;">Ventas detectadas — {{ posItems.length }} productos</span>
            <div style="display:flex;gap:8px;font-size:0.75rem;">
              <span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:6px;font-weight:600;">{{ countPosStatus('found') }} encontrados</span>
              <span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:6px;font-weight:600;">{{ countPosStatus('review') }} revisar</span>
              <span style="background:#fee2e2;color:#991b1b;padding:3px 8px;border-radius:6px;font-weight:600;">{{ countPosStatus('not_found') }} no encontrados</span>
            </div>
          </div>

          <div class="restock-mobile">
            <div *ngFor="let item of posItems; let i = index" style="padding:14px 16px;border-bottom:1px solid #f4f4f4;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div><div style="font-weight:700;color:#102319;font-size:0.88rem;">{{ item.product_name }}</div><div style="font-size:0.76rem;color:#516052;margin-top:2px;">Cant. vendida: {{ item.qty_sold }}</div></div>
                <span [style.background]="getPosBadgeBg(item.status)" [style.color]="getPosBadgeColor(item.status)" style="font-size:0.68rem;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;">{{ getPosBadgeLabel(item.status) }}</span>
              </div>
              <div *ngIf="item.matched_plant_name" style="background:#f4f8f1;border-radius:10px;padding:10px;font-size:0.8rem;">
                <div style="color:#102319;font-weight:600;">→ {{ item.matched_plant_name }}</div>
                <div style="color:#516052;margin-top:3px;">Stock: {{ item.current_stock }} → <strong [style.color]="item.over_stock?'#dc2626':'#15803d'">{{ item.stock_after }}</strong></div>
                <div *ngIf="item.over_stock" style="color:#dc2626;font-size:0.72rem;margin-top:4px;">⚠️ Venta supera el stock actual</div>
              </div>
              <div *ngIf="!item.matched_plant_name" style="font-size:0.78rem;color:#9ca3af;margin-top:4px;">No se encontró en el catálogo</div>
              <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
                <input type="checkbox" [id]="'skip-'+i" [(ngModel)]="item.skip" style="width:15px;height:15px;accent-color:#14452F;">
                <label [for]="'skip-'+i" style="font-size:0.75rem;color:#516052;cursor:pointer;">Omitir esta fila</label>
              </div>
            </div>
          </div>

          <div class="restock-desktop" style="overflow-x:auto;">
            <table class="restock-table">
              <thead><tr><th>Producto del POS</th><th>Cant. vendida</th><th>Planta encontrada</th><th>Stock actual</th><th>Stock después</th><th>Estado</th><th>Omitir</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of posItems; let i = index" [style.opacity]="item.skip?'0.4':'1'">
                  <td style="font-weight:600;color:#102319;">{{ item.product_name }}</td>
                  <td style="font-weight:700;color:#516052;">{{ item.qty_sold }}</td>
                  <td><span *ngIf="item.matched_plant_name" style="color:#102319;">{{ item.matched_plant_name }}</span><span *ngIf="!item.matched_plant_name" style="color:#aaa;font-size:0.78rem;">—</span></td>
                  <td style="color:#516052;">{{ item.current_stock??'—' }}</td>
                  <td><span *ngIf="item.stock_after!==null" [style.color]="item.over_stock?'#dc2626':'#15803d'" style="font-weight:700;">{{ item.stock_after }}</span><span *ngIf="item.stock_after===null" style="color:#aaa;">—</span><div *ngIf="item.over_stock" style="font-size:0.65rem;color:#dc2626;">⚠️ supera stock</div></td>
                  <td><span [style.background]="getPosBadgeBg(item.status)" [style.color]="getPosBadgeColor(item.status)" style="font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;">{{ getPosBadgeLabel(item.status) }}</span></td>
                  <td style="text-align:center;"><input type="checkbox" [(ngModel)]="item.skip" style="width:15px;height:15px;accent-color:#14452F;cursor:pointer;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="padding:14px 18px 16px;display:flex;flex-wrap:wrap;gap:10px;">
            <button (click)="confirmPosImport()" class="btn-primary" style="flex:1;min-width:160px;display:flex;align-items:center;justify-content:center;gap:7px;">
              <i data-lucide="check" style="width:16px;height:16px;"></i>
              Confirmar descuento
            </button>
            <button (click)="cancelPosImport()" class="btn-secondary" style="flex:1;min-width:130px;">Cancelar</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminComponent implements OnInit, AfterViewInit {
  readonly PLANT_CATEGORIES = PLANT_CATEGORIES;

  clientSlug = 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  loading = true;
  plantForm: Plant = this.emptyPlant();
  editingId?: number;
  imageUploading = false;
  showForm = false;

  // Navigation
  activeTab: 'dashboard' | 'ventas' | 'inventario' | 'pos' = 'dashboard';

  // ✅ Inventory filter
  inventoryFilter: 'all' | 'low' | 'out' = 'all';

  // AI Restock
  selectedInvoice: File | null = null;
  invoiceLoading = false;
  restockItems: RestockItem[] = [];
  desiredMargin = 50;

  // POS Import
  posFile: File | null = null;
  posLoading = false;
  posError = '';
  posItems: any[] = [];
  posImportSuccessMsg = '';

  // Sales Report
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

  setTab(tab: 'dashboard' | 'ventas' | 'inventario' | 'pos') {
    this.activeTab = tab;
    this.cdr.detectChanges();
    this.renderIcons();
  }

  // ✅ Navega al inventario con filtro específico
  goToInventory(filter: 'all' | 'low' | 'out') {
    this.inventoryFilter = filter;
    this.setTab('inventario');
  }

  // ✅ Lista filtrada de plantas
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
      next: client => { this.client = { ...client }; this.cdr.detectChanges(); },
      error: err => console.error(err)
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

  changeSalesPeriod(period: string) {
    this.selectedSalesPeriod = period;
    this.loadSalesReport(period);
  }

  getDailySummary(): { date: string; units: number; revenue: number; items: number }[] {
    if (!this.salesReport?.recent_imports?.length) return [];
    const map = new Map<string, { date: string; units: number; revenue: number; items: number }>();
    for (const row of this.salesReport.recent_imports) {
      const d = new Date(row.imported_at);
      const key = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear().toString().slice(2)}`;
      if (!map.has(key)) map.set(key, { date: key, units: 0, revenue: 0, items: 0 });
      const entry = map.get(key)!;
      entry.units   += row.qty_sold  || 0;
      entry.revenue += (row.qty_sold || 0) * (row.price || 0);
      entry.items   += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  getBarPxRevenue(value: number): number {
    if (!this.salesReport?.chart_data?.length) return 0;
    const max = Math.max(...this.salesReport.chart_data.map(d => d.revenue), 1);
    return Math.max(4, Math.round((value / max) * 90));
  }
  getBarPxUnits(value: number): number {
    if (!this.salesReport?.chart_data?.length) return 0;
    const max = Math.max(...this.salesReport.chart_data.map(d => d.units), 1);
    return Math.max(4, Math.round((value / max) * 40));
  }
  formatChartDay(day: string): string {
    if (!day) return '';
    const d = new Date(day);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  logout() { sessionStorage.removeItem('admin_slug'); this.router.navigate(['/']); }
  goToPublic() { this.router.navigate(['/']); }

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
    if (m >= 40) return '✅ Buen margen'; if (m >= 20) return '⚠️ Margen bajo'; return '🔴 Sin margen';
  }
  getRowMarginTag(item: RestockItem): string {
    const m = this.getRowMargin(item);
    return m >= 40 ? 'tag-ok' : m >= 20 ? 'tag-suggested' : 'tag-warn';
  }
  countApplied(): number { return this.restockItems.filter(i => i.apply_suggested_price).length; }
  get totalInvoiceCost(): number { return this.restockItems.reduce((s,i) => s + (i.unit_cost * i.quantity), 0); }

  onInvoiceSelected(event: any) { const f = event.target.files[0]; if (f) this.selectedInvoice = f; }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    this.plantService.analyzeInvoice(this.selectedInvoice).subscribe({
      next: (res) => { this.restockItems = this.buildRestockItems(res.items || []); this.invoiceLoading = false; this.cdr.detectChanges(); this.renderIcons(); },
      error: () => { this.invoiceLoading = false; this.restockItems = this.buildRestockItems([{ plant_name: 'Ficus Lyrata', quantity: 5, unit_cost: 15.00 }]); this.cdr.detectChanges(); }
    });
  }

  buildRestockItems(raw: any[]): RestockItem[] {
    return raw.map(r => {
      const match = this.plants.find(p => p.name.toLowerCase().includes((r.plant_name||'').toLowerCase()));
      const hasPrice = match?.price != null && match.price > 0;
      return { plant_name: r.plant_name||'', category: r.category||match?.category||'', quantity: r.quantity||1, unit_cost: r.unit_cost||0, total_cost: (r.unit_cost||0)*(r.quantity||1), current_sale_price: match?.price??null, row_margin: this.desiredMargin, apply_suggested_price: !hasPrice };
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
      next: (res) => { this.posItems = res.items.map((i: any) => ({ ...i, skip: i.status==='not_found' })); this.posLoading = false; this.cdr.detectChanges(); this.renderIcons(); },
      error: (err) => { this.posError = err.error?.message||'Error analizando el archivo.'; this.posLoading = false; this.cdr.detectChanges(); }
    });
  }

  confirmPosImport() {
    const toImport = this.posItems.filter(i => !i.skip && i.matched_plant_id);
    if (!toImport.length) { alert('No hay productos válidos para importar.'); return; }
    this.plantService.confirmPosImport(this.clientSlug, toImport, this.posFile?.name||'import').subscribe({
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

  countPosStatus(status: string): number { return this.posItems.filter(i => i.status===status).length; }
  getPosBadgeBg(s: string) { return s==='found'?'#dcfce7':s==='review'?'#fef3c7':'#fee2e2'; }
  getPosBadgeColor(s: string) { return s==='found'?'#15803d':s==='review'?'#92400e':'#991b1b'; }
  getPosBadgeLabel(s: string) { return s==='found'?'✅ Encontrado':s==='review'?'⚠️ Revisar':'❌ No encontrado'; }

  savePlant() {
    if (!this.plantForm.name) return;
    const req = this.editingId ? this.plantService.updatePlant(this.editingId, this.plantForm) : this.plantService.createPlant(this.clientSlug, this.plantForm);
    req.subscribe({ next: () => { this.resetForm(); this.showForm = false; this.loadData(); }, error: e => console.error(e) });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id; this.plantForm = { ...plant }; this.showForm = true;
    setTimeout(() => { document.getElementById('plant-form')?.scrollIntoView({ behavior: 'smooth' }); this.renderIcons(); }, 50);
  }

  removePlant(plant: Plant) {
    if (!plant.id) return;
    if (confirm(`¿Eliminar ${plant.name}?`)) {
      this.plantService.deletePlant(plant.id).subscribe({ next: () => this.loadData(), error: e => console.error(e) });
    }
  }

  resetForm() { this.editingId = undefined; this.plantForm = this.emptyPlant(); }

  emptyPlant(): Plant {
    return { name:'', category:'', description:'', price: undefined as any, cost_price: undefined as any, stock: undefined as any, image_url:'', light:'', water:'', is_featured:false, is_active:true };
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