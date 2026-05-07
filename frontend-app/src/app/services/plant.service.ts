import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: number;
  slug: string;
  business_name: string;
  whatsapp_number: string;
  logo_url?: string;
  primary_color?: string;
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

export interface InvoiceItem {
  plant_name: string;
  quantity: number;
  unit_cost?: number;
  matched_plant_id?: number | null;
  matched_plant_name?: string | null;
}

export interface InvoiceAnalysisResponse {
  message: string;
  result: {
    items: InvoiceItem[];
  };
}

export interface RestockResponse {
  message: string;
  updates: {
    matched?: string;
    unmatched?: string;
    added?: number;
  }[];
}

export interface PosImportItem {
  product_name: string;
  qty_sold: number;
  unit_price?: number;
  unit_cost?: number;
  matched_plant_id?: number | null;
  matched_plant_name?: string | null;
  current_stock?: number;
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
    name: string;
    category: string;
    image_url: string;
    units_sold: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
  chart_data: {
    day: string;
    units: number;
    revenue: number;
  }[];
  recent_imports: any[];
}

@Injectable({ providedIn: 'root' })
export class PlantService {
  private apiUrl = 'https://verzagarden-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  getClient(slug: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${slug}`);
  }

  login(slug: string, username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/login`, {
      username,
      password
    });
  }

  getPlants(slug: string): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${this.apiUrl}/clients/${slug}/plants`);
  }

  createPlant(slug: string, plant: Plant): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/plants`, plant);
  }

  updatePlant(id: number, plant: Plant): Observable<any> {
    return this.http.put(`${this.apiUrl}/plants/${id}`, plant);
  }

  deletePlant(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/plants/${id}`);
  }

  analyzeInvoice(slug: string, file: File): Observable<InvoiceAnalysisResponse> {
    const formData = new FormData();
    formData.append('invoice', file);

    return this.http.post<InvoiceAnalysisResponse>(
      `${this.apiUrl}/clients/${slug}/invoices/analyze`,
      formData
    );
  }

  restockPlants(slug: string, items: InvoiceItem[]): Observable<RestockResponse> {
    return this.http.post<RestockResponse>(
      `${this.apiUrl}/clients/${slug}/invoices/confirm-restock`,
      { items }
    );
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  analyzePosFile(slug: string, formData: FormData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/clients/${slug}/pos-import/analyze`,
      formData
    );
  }

  confirmPosImport(slug: string, items: PosImportItem[], filename: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/clients/${slug}/pos-import/confirm`,
      {
        items,
        filename
      }
    );
  }

  getSalesReport(slug: string, period: string = 'month'): Observable<SalesReport> {
    return this.http.get<SalesReport>(
      `${this.apiUrl}/clients/${slug}/sales-report?period=${period}`
    );
  }
}