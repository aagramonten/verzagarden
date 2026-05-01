@Injectable({ providedIn: 'root' })
export class PlantService {
  private apiUrl = 'https://api.verzagarden.com/api';

  constructor(private http: HttpClient) {}

  // ======================
  // CLIENT & PLANTS
  // ======================

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