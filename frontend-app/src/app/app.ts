import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantService, Client, Plant } from './services/plant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  isEnglish = false;
  clientSlug = 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  search = '';
  selectedCategory = 'Todas';
  adminMode = false;
  loading = true;

  // Variables para el formulario de plantas
  plantForm: Plant = this.emptyPlant();
  editingId?: number;

  // Variables para el "AI Restock" (Facturas)
  selectedInvoice: File | null = null;
  invoiceLoading = false;
  invoiceResult: { items: any[] } | null = null;

  constructor(private plantService: PlantService) {}

  ngOnInit() {
    this.loadData();
  }

loadData() {
  if (!this.plants.length) this.loading = true;

  this.plantService.getPlants(this.clientSlug).subscribe({
    next: plants => {
      console.log('✅ Plantas recibidas:', plants.length); // ← línea 42
      this.plants = [...plants];
      this.loading = false;
    },
    error: err => {
      console.log('❌ Error plantas:', err); // ← línea 47
      this.loading = false;
    }
  });

  this.plantService.getClient(this.clientSlug).subscribe({
    next: client => this.client = { ...client }, // ← fuerza detección de cambios
    error: err => console.error('Error cargando cliente:', err)
  });
}

  toggleLanguage() {
    this.isEnglish = !this.isEnglish;
  }

  get categories() {
    return ['Todas', ...new Set(this.plants.map(p => p.category || 'Sin categoría'))];
  }

  get filteredPlants() {
    const term = this.search.toLowerCase().trim();
    return this.plants.filter(plant => {
      const matchSearch = !term || plant.name.toLowerCase().includes(term) || (plant.description || '').toLowerCase().includes(term);
      const matchCategory = this.selectedCategory === 'Todas' || plant.category === this.selectedCategory;
      return matchSearch && matchCategory;
    });
  }

  whatsappLink(plant: Plant) {
    const number = this.client?.whatsapp_number || '17876195211';
    const message = `Hola, me interesa esta planta del catálogo:\n\n🪴 Nombre: ${plant.name}\n💰 Precio: $${plant.price}\n\n¿Tienen disponibilidad?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  // --- MÉTODOS CRUD DE PLANTAS ---

  savePlant() {
    if (!this.plantForm.name || this.plantForm.price < 0) return;

    const request = this.editingId
      ? this.plantService.updatePlant(this.editingId, this.plantForm)
      : this.plantService.createPlant(this.clientSlug, this.plantForm);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.loadData();
      },
      error: err => console.error(err)
    });
  }

  editPlant(plant: Plant) {
    this.editingId = plant.id;
    this.plantForm = { ...plant };
    this.adminMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removePlant(plant: Plant) {
    if (!plant.id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar ${plant.name}?`)) {
      this.plantService.deletePlant(plant.id).subscribe({
        next: () => this.loadData(),
        error: err => console.error(err)
      });
    }
  }

  resetForm() {
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

  // --- MÉTODOS DE FACTURACIÓN (AI RESTOCK) ---

  onInvoiceSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedInvoice = file;
    }
  }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    
    this.plantService.analyzeInvoice(this.selectedInvoice).subscribe({
      next: (res) => {
        this.invoiceResult = res;
        this.invoiceLoading = false;
      },
      error: (err) => {
        console.error('Error analizando la factura:', err);
        this.invoiceLoading = false;
        // Mock de prueba en caso de que el backend falle o no esté listo:
        this.invoiceResult = {
          items: [{ plant_name: 'Ficus Lyrata (Autodetectado)', quantity: 5, unit_cost: 15.00 }]
        };
      }
    });
  }

  removeItemFromInvoice(index: number) {
    if (this.invoiceResult && this.invoiceResult.items) {
      this.invoiceResult.items.splice(index, 1);
    }
  }

  confirmRestock() {
    if (!this.invoiceResult?.items?.length) return;
    
    this.plantService.restockPlants(this.clientSlug, this.invoiceResult.items).subscribe({
      next: () => {
        this.cancelInvoice();
        this.loadData();
        alert('¡Inventario actualizado correctamente!');
      },
      error: err => console.error('Error al actualizar stock:', err)
    });
  }

  cancelInvoice() {
    this.selectedInvoice = null;
    this.invoiceResult = null;
    // Resetear el input file si es necesario
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}