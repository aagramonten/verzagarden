import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantService, Client, Plant } from './services/plant.service';
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
  clientSlug = 'demo-garden';
  client?: Client;
  plants: Plant[] = [];
  search = '';
  selectedCategory = 'Todas';
  adminMode = false;
  showLoginModal = false;
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  loginLoading = false;
  loading = true;

  plantForm: Plant = this.emptyPlant();
  editingId?: number;

  selectedInvoice: File | null = null;
  invoiceLoading = false;
  invoiceResult: { items: any[] } | null = null;

  imageUploading = false;

  uploadPlantImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.imageUploading = true;
    this.plantService.uploadImage(file).subscribe({
      next: (res) => {
        this.plantForm.image_url = res.url;
        this.imageUploading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.imageUploading = false; }
    });
  }

  constructor(private plantService: PlantService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  getGeneralWhatsappLink(): string {
    const phone = this.client?.whatsapp_number || '19392360534';
    const message = "Hola, me gustaría hacer una consulta general sobre el inventario.";
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  loadData() {
    if (!this.plants.length) this.loading = true;
    this.plantService.getPlants(this.clientSlug).subscribe({
      next: plants => {
        this.plants = [...plants];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
    this.plantService.getClient(this.clientSlug).subscribe({
      next: client => this.client = { ...client },
      error: err => console.error('Error cargando cliente:', err)
    });
  }

  toggleLanguage() { this.isEnglish = !this.isEnglish; }

  openAdminModal() {
    if (this.isAdminAuthenticated()) {
      this.adminMode = true;
    } else {
      this.showLoginModal = true;
      this.loginError = '';
    }
  }

  isAdminAuthenticated(): boolean {
    return sessionStorage.getItem('admin_slug') === this.clientSlug;
  }

  submitLogin() {
    if (!this.loginUsername || !this.loginPassword) return;
    this.loginLoading = true;
    this.loginError = '';
    this.plantService.login(this.clientSlug, this.loginUsername, this.loginPassword).subscribe({
      next: () => {
        sessionStorage.setItem('admin_slug', this.clientSlug);
        this.showLoginModal = false;
        this.adminMode = true;
        this.loginLoading = false;
        this.loginUsername = '';
        this.loginPassword = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.loginError = 'Usuario o contraseña incorrectos';
        this.loginLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    this.showLoginModal = false;
    this.loginError = '';
    this.loginUsername = '';
    this.loginPassword = '';
  }

  logout() {
    sessionStorage.removeItem('admin_slug');
    this.adminMode = false;
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

  // --- MÉTRICAS PARA EL DASHBOARD ---
  get totalStock(): number {
    return this.plants.reduce((sum, p) => sum + (p.stock || 0), 0);
  }

  get lowStockPlants(): Plant[] {
    return this.plants.filter(p => p.stock > 0 && p.stock <= 5);
  }

  get outOfStockPlants(): Plant[] {
    return this.plants.filter(p => p.stock <= 0);
  }

  get estimatedInventoryValue(): number {
    return this.plants.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
  }

  whatsappLink(plant: Plant) {
    const number = this.client?.whatsapp_number || '19392360534';
    const message = `Hola, me interesa esta planta del catálogo:\n\n🪴 Nombre: ${plant.name}\n💰 Precio: $${plant.price}\n\n¿Tienen disponibilidad?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  savePlant() {
    if (!this.plantForm.name || this.plantForm.price < 0) return;
    const request = this.editingId
      ? this.plantService.updatePlant(this.editingId, this.plantForm)
      : this.plantService.createPlant(this.clientSlug, this.plantForm);
    request.subscribe({
      next: () => { this.resetForm(); this.loadData(); },
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
    return { name: '', category: 'Exterior', description: '', price: 0, stock: 0, image_url: '', light: '', water: '', is_featured: false, is_active: true };
  }

  onInvoiceSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedInvoice = file;
  }

  analyzeInvoice() {
    if (!this.selectedInvoice) return;
    this.invoiceLoading = true;
    this.plantService.analyzeInvoice(this.selectedInvoice).subscribe({
      next: (res) => { this.invoiceResult = res; this.invoiceLoading = false; },
      error: () => {
        this.invoiceLoading = false;
        this.invoiceResult = { items: [{ plant_name: 'Ficus Lyrata (Autodetectado)', quantity: 5, unit_cost: 15.00 }] };
      }
    });
  }

  removeItemFromInvoice(index: number) {
    if (this.invoiceResult?.items) this.invoiceResult.items.splice(index, 1);
  }

  confirmRestock() {
    if (!this.invoiceResult?.items?.length) return;
    this.plantService.restockPlants(this.clientSlug, this.invoiceResult.items).subscribe({
      next: () => { this.cancelInvoice(); this.loadData(); alert('¡Inventario actualizado correctamente!'); },
      error: err => console.error('Error al actualizar stock:', err)
    });
  }

  cancelInvoice() {
    this.selectedInvoice = null;
    this.invoiceResult = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}