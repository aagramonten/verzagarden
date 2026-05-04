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
  cost_price?: number | null;   // costo de compra mayorista
  stock: number;
  image_url?: string;
  light?: string;
  water?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlantService {
  private apiUrl = 'https://verzagarden-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  getClient(slug: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${slug}`);
  }

  login(slug: string, username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/login`, { username, password });
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

  analyzeInvoice(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('invoice', file);
    return this.http.post(`${this.apiUrl}/clients/demo-garden/invoices/analyze`, formData);
  }

  restockPlants(slug: string, items: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${slug}/invoices/confirm-restock`, { items });
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}