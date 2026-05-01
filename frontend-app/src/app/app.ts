import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantService, Client, Plant, InvoiceItem } from './services/plant.service';
import { PlantCardComponent } from './plant-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PlantCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  isEnglish = false;

  // Cliente real creado en MySQL
  clientSlug = 'jardin-morales';

  client?: Client;
  plants: Plant[] = [];
  search = '';
  selectedCategory = 'Todas';
  adminMode = false;
  loading = true;

  plantForm: Plant = this.emptyPlant();
  editingId?: number;

  selectedInvoice?: File;
  invoiceLoading = false;
  invoiceResult?: { items: InvoiceItem[] };
  restockResult: any = null;

  constructor(
    private plantService: PlantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.plantService.getClient(this.clientSlug).subscribe({
      next: (client: Client) => {
        this.client = client;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
      }
    });

    this.plantService.getPlants(this.clientSlug).subscribe({
      next: (plants: Plant[]) => {
        this.plants = plants;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onInvoiceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.selectedInvoice = input.files[0];
    this.invoiceResult = undefined;
    this.restockResult = null;
    this.cdr.detectChanges();
  }

  analyzeInvoice(): void {
    if (!this.selectedInvoice) {
      return;
    }

    this.invoiceLoading = true;

    this.plantService.analyzeInvoice(this.clientSlug, this.selectedInvoice).subscribe({
      next: (response: { result: { items: InvoiceItem[] } }) => {
        this.invoiceResult = response.result;
        this.invoiceLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        alert('Error analizando factura');
        this.invoiceLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeItemFromInvoice(index: number): void {
    if (!this.invoiceResult?.items) {
      return;
    }

    this.invoiceResult.items.splice(index, 1);
    this.cdr.detectChanges();
  }

  cancelInvoice(): void {
    this.selectedInvoice = undefined;
    this.invoiceResult = undefined;
    this.restockResult = null;
    this.cdr.detectChanges();
  }

  confirmRestock(): void {
    if (!this.invoiceResult?.items?.length) {
      return;
    }

    this.plantService.confirmRestock(this.clientSlug, this.invoiceResult.items).subscribe({
      next: (response: any) => {
        this.restockResult = response;
        this.invoiceResult = undefined;
        this.loadData();
      },
      error: (err: any) => {
        console.error(err);
        alert('Error actualizando inventario');
      }
    });
  }

  toggleLanguage(): void {
    this.isEnglish = !this.isEnglish;
  }

  get categories(): string[] {
    return [
      'Todas',
      ...new Set(this.plants.map((plant: Plant) => plant.category || 'Sin categoría'))
    ];
  }

  get filteredPlants(): Plant[] {
    const term = this.search.toLowerCase().trim();

    return this.plants.filter((plant: Plant) => {
      const matchSearch =
        !term ||
        plant.name.toLowerCase().includes(term) ||
        (plant.description || '').toLowerCase().includes(term);

      const matchCategory =
        this.selectedCategory === 'Todas' ||
        plant.category === this.selectedCategory;

      return matchSearch && matchCategory;
    });
  }

  savePlant(): void {
    if (!this.plantForm.name || this.plantForm.price < 0) {
      return;
    }

    const request = this.editingId
      ? this.plantService.updatePlant(this.editingId, this.plantForm)
      : this.plantService.createPlant(this.clientSlug, this.plantForm);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadData();
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  editPlant(plant: Plant): void {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    this.adminMode = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  removePlant(plant: Plant): void {
    if (!plant.id) {
      return;
    }

    this.plantService.deletePlant(plant.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  whatsappLink(plant: Plant): string {
    const phone = this.client?.whatsapp_number || this.client?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    const message = `Hola, estoy interesado en esta planta:

Planta: ${plant.name}
Precio: $${plant.price}
Stock disponible: ${plant.stock}

¿Sigue disponible?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  resetForm(): void {
    this.editingId = undefined;
    this.plantForm = this.emptyPlant();
  }

  emptyPlant(): Plant {
    return {
      name: '',
      category: 'Exterior',
      description: '',
      price: 0,
      stock: 0,
      image_url: '',
      light: '',
      water: '',
      is_featured: false,
      is_active: true
    };
  }
}