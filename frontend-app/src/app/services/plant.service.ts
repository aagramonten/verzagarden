import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id?: number;
  name?: string;
  slug?: string;
  business_name?: string;
  whatsapp_number?: string;
}

export interface Plant {
  id?: number;
  name: string;
  category?: string;
  description?: string;
  price: number;
  stock: number; // Required field to prevent 'undefined' errors
  image_url?: string;
  light?: string;
  water?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

export interface InvoiceItem {
  plant_name: string;
  quantity: number;
  unit_cost: number;
}

export interface InvoiceResult {
  items: InvoiceItem[];
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlantService {
  private apiUrl = 'http://localhost:8000/api'; 

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
    formData.append('file', file);
    return this.http.post<{ result: InvoiceResult }>(
      `${this.apiUrl}/clients/${slug}/analyze-invoice`,
      formData
    );
  }

  confirmRestock(slug: string, items: InvoiceItem[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/restock`, { items });
  }
}