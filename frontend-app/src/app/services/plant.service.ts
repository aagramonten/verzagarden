import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Client {
  id: number;
  slug: string;
  business_name: string;
  whatsapp_number: string;
  logo_url?: string;
  primary_color?: string;
  whatsapp_message?: string;
}

export interface Plant {
  id?: number;
  name: string;
  category?: string;
  description?: string;
  price: number;
  cost_price?: number | null;
  stock: number;
  image_url?: string;
  light?: string;
  water?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

export interface Category {
  id: number;
  client_id: number;
  slug: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  description_en?: string;
  ideal?: string;
  ideal_en?: string;
  group_type: 'plants' | 'products';
  sort_order: number;
}

export interface AdminUser {
  id: number;
  client_id?: number;
  name: string;
  username: string;
  role: 'owner' | 'manager' | 'vendor';
  is_active: boolean;
  created_at?: string;
}

export interface LoginResponse {
  ok: boolean;
  slug: string;
  user_id: number;
  name: string;
  role: 'owner' | 'manager' | 'vendor';
}

export interface InvoiceItem {
  plant_name: string;
  quantity: number;
  unit_cost?: number;
  matched_plant_id?: number | null;
  matched_plant_name?: string | null;
}

export interface InvoiceAnalysisResponse {
  message: string;
  result: { items: InvoiceItem[] };
}

export interface RestockResponse {
  message: string;
  updates: { matched?: string; unmatched?: string; added?: number }[];
}

export interface PosImportItem {
  product_name: string;
  qty_sold: number;
  unit_price?: number;
  unit_cost?: number;
  matched_plant_id?: number | null;
  matched_plant_name?: string | null;
  current_stock?: number;
  skip?: boolean;
}

export interface SalesReport {
  period: string;
  summary: {
    total_transactions: number;
    total_units: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    margin_pct: number;
  };
  top_plants: {
    name: string; category: string; image_url: string;
    units_sold: number; revenue: number; cost: number; profit: number;
  }[];
  chart_data: { day: string; units: number; revenue: number }[];
  recent_imports: any[];
}

// =======================
// Permisos por rol
// =======================
export type UserRole = 'owner' | 'manager' | 'vendor';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner:   'Dueño',
  manager: 'Gerente',
  vendor:  'Vendedor',
};

export const PERMISSIONS = {
  canSeeDashboardFull:   (r: UserRole) => r === 'owner',
  canSeeDashboard:       (r: UserRole) => r === 'owner' || r === 'manager',
  canSeeVentas:          (r: UserRole) => r === 'owner',
  canSeeStock:           (r: UserRole) => r === 'owner' || r === 'manager',
  canImportPOS:          (r: UserRole) => r === 'owner' || r === 'manager',
  canRestock:            (r: UserRole) => r === 'owner' || r === 'manager',
  canEditInventoryFull:  (r: UserRole) => r === 'owner' || r === 'manager',
  canEditInventoryBasic: (r: UserRole) => r === 'vendor',
  canSeeCategorias:      (r: UserRole) => r === 'owner' || r === 'manager',
  canSeeAjustes:         (r: UserRole) => r === 'owner',
  canManageUsers:        (r: UserRole) => r === 'owner',
};

@Injectable({ providedIn: 'root' })
export class PlantService {
  private apiUrl = 'https://verzagarden-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  // =======================
  // 🔐 Sesión
  // =======================
  getSlug(): string {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') return parts[0];
    return sessionStorage.getItem('admin_slug') || 'demo';
  }

  isSubdomain(): boolean {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    return parts.length >= 3 && parts[0] !== 'www';
  }

  saveSession(data: LoginResponse) {
    sessionStorage.setItem('admin_slug',    data.slug);
    sessionStorage.setItem('admin_user_id', String(data.user_id));
    sessionStorage.setItem('admin_name',    data.name);
    sessionStorage.setItem('admin_role',    data.role);
  }

  clearSession() {
    sessionStorage.removeItem('admin_slug');
    sessionStorage.removeItem('admin_user_id');
    sessionStorage.removeItem('admin_name');
    sessionStorage.removeItem('admin_role');
  }

  getRole(): UserRole | null {
    return sessionStorage.getItem('admin_role') as UserRole | null;
  }

  getName(): string {
    return sessionStorage.getItem('admin_name') || '';
  }

  getUserId(): string {
    return sessionStorage.getItem('admin_user_id') || '';
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-user-id':   this.getUserId(),
      'x-user-role': this.getRole() || '',
    });
  }

  // =======================
  // 🔑 Login
  // =======================
  login(slug: string, username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/clients/${slug}/login`, { username, password });
  }

  // =======================
  // 👥 Usuarios admin
  // =======================
  getAdminUsers(slug: string): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(
      `${this.apiUrl}/clients/${slug}/admin-users`,
      { headers: this.authHeaders() }
    );
  }

  createAdminUser(slug: string, data: { name: string; username: string; password: string; role: UserRole }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/clients/${slug}/admin-users`,
      data,
      { headers: this.authHeaders() }
    );
  }

  updateAdminUser(slug: string, id: number, data: Partial<AdminUser & { password?: string }>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/clients/${slug}/admin-users/${id}`,
      data,
      { headers: this.authHeaders() }
    );
  }

  // =======================
  // 🏪 Cliente
  // =======================
  getClient(slug: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${slug}`);
  }

  updateClientSettings(slug: string, whatsapp_message: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/clients/${slug}/settings`, { whatsapp_message });
  }

  // =======================
  // 🌱 Plantas
  // =======================
  getPlants(slug: string): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${this.apiUrl}/clients/${slug}/plants`).pipe(
      map(plants => plants.map(p => ({
        ...p,
        price:      p.price      != null ? Number(p.price)      : p.price,
        cost_price: p.cost_price != null ? Number(p.cost_price) : null,
        stock:      p.stock      != null ? Number(p.stock)      : 0,
      })))
    );
  }

  createPlant(slug: string, plant: Plant): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/plants`, plant);
  }

  updatePlant(id: number, plant: Plant): Observable<any> {
    return this.http.put(`${this.apiUrl}/plants/${id}`, plant);
  }

  // Solo para vendedor — nombre, descripción, foto
  vendorUpdatePlant(id: number, data: { name: string; description: string; image_url: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/plants/${id}/vendor-update`, data);
  }

  deletePlant(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/plants/${id}`);
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  // =======================
  // 📂 Categorías
  // =======================
  getCategories(slug: string): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/clients/${slug}/categories`);
  }

  updateCategory(slug: string, id: number, data: Partial<Category>): Observable<any> {
    return this.http.put(`${this.apiUrl}/clients/${slug}/categories/${id}`, data);
  }

  // =======================
  // 📦 Facturas & POS
  // =======================
  analyzeInvoice(slug: string, file: File): Observable<InvoiceAnalysisResponse> {
    const formData = new FormData();
    formData.append('invoice', file);
    return this.http.post<InvoiceAnalysisResponse>(
      `${this.apiUrl}/clients/${slug}/invoices/analyze`, formData
    );
  }

  restockPlants(slug: string, items: InvoiceItem[]): Observable<RestockResponse> {
    return this.http.post<RestockResponse>(
      `${this.apiUrl}/clients/${slug}/invoices/confirm-restock`, { items }
    );
  }

  analyzePosFile(slug: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/pos-import/analyze`, formData);
  }

  confirmPosImport(slug: string, items: PosImportItem[], filename: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/clients/${slug}/pos-import/confirm`, { items, filename }
    );
  }

  // =======================
  // 📈 Ventas
  // =======================
  getSalesReport(slug: string, period: string = 'month'): Observable<SalesReport> {
    return this.http.get<SalesReport>(
      `${this.apiUrl}/clients/${slug}/sales-report?period=${period}`
    );
  }
}