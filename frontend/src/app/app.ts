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

  plantForm: Plant = this.emptyPlant();
  editingId?: number;

  constructor(private plantService: PlantService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.plantService.getClient(this.clientSlug).subscribe({
      next: client => this.client = client,
      error: err => console.error(err)
    });

    this.plantService.getPlants(this.clientSlug).subscribe({
      next: plants => {
        this.plants = plants;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
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
    const message = `Hola, me interesa esta planta:\n\nNombre: ${plant.name}\nPrecio: $${plant.price}\nStock: ${plant.stock}\n\n¿Está disponible?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

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
    this.plantService.deletePlant(plant.id).subscribe({
      next: () => this.loadData(),
      error: err => console.error(err)
    });
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
}
