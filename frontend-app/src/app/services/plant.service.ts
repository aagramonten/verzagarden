import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: number;
  slug: string;
  business_name: string;
  phone?: string;
  whatsapp_number?: string;
  logo_url?: string;
  primary_color?: string;
}

export interface Plant {
  id?: number;
  client_id?: number;
  name: string;
  category?: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  light?: string;
  water?: string;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface InvoiceItem {
  plant_name: string;
  quantity: number;
  unit_cost: number;
}

export interface InvoiceResult {
  items: InvoiceItem[];
}

@Injectable({ providedIn: 'root' })
export class PlantService {
  private apiUrl = 'https://api.verzagarden.com/api';

  constructor(private http: HttpClient) {}

  getClient(slug: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${slug}`);
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

  analyzeInvoice(slug: string, file: File): Observable<{ result: InvoiceResult }> {
    const formData = new FormData();
    formData.append('invoice', file);

    return this.http.post<{ result: InvoiceResult }>(
      `${this.apiUrl}/clients/${slug}/invoices/analyze`,
      formData
    );
  }

  confirmRestock(slug: string, items: InvoiceItem[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/clients/${slug}/invoices/confirm-restock`,
      { items }
    );
  }
}