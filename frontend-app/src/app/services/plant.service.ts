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

  // --- NUEVOS ENDPOINTS PARA AI RESTOCK ---

  analyzeInvoice(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('invoice', file);
    // Asumiendo que tu backend tiene un endpoint de análisis OCR / IA
    return this.http.post(`${this.apiUrl}/inventory/analyze-invoice`, formData);
  }

  restockPlants(slug: string, items: any[]): Observable<any> {
    // Endpoint para subir las nuevas cantidades extraídas de la factura
    return this.http.post(`${this.apiUrl}/clients/${slug}/inventory/restock`, { items });
  }
}