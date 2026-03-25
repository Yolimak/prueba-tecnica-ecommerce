import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  badge?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  // ── AUTH STATE ─────────────────────────────
  isAuthenticated = false;
  nombre = '';
  rol = '';
  cartCount = 0;

  // ── MODAL LOGIN ────────────────────────────
  showLoginModal = false;
  modalUsername = '';
  modalPassword = '';
  modalLoading = false;
  modalError = '';
  modalShowPassword = false;

  // ── CART ───────────────────────────────────
  cart: { product: Product; qty: number }[] = [];
  showCart = false;

  // ── PRODUCTS ───────────────────────────────
  selectedCategory = 'todos';
  searchQuery = '';

  categories = [
    { key: 'todos', label: 'Todos' },
    { key: 'monitores', label: 'Monitores' },
    { key: 'perifericos', label: 'Periféricos' },
    { key: 'componentes', label: 'Componentes' },
    { key: 'almacenamiento', label: 'Almacenamiento' },
  ];

  products: Product[] = [
    { id: 1, name: 'Monitor LG UltraWide 34"', category: 'monitores', price: 1850000, image: '🖥️', description: 'Panel IPS 3440x1440, 144Hz, HDR10', badge: 'Más vendido' },
    { id: 2, name: 'Monitor Samsung 27" 4K', category: 'monitores', price: 1200000, image: '🖥️', description: 'Panel VA 4K UHD, 60Hz, Eye Care' },
    { id: 3, name: 'Monitor Curvo 32" 165Hz', category: 'monitores', price: 980000, image: '🖥️', description: 'Panel VA 1080p, 165Hz, FreeSync' },
    { id: 4, name: 'Mouse Logitech MX Master 3', category: 'perifericos', price: 320000, image: '🖱️', description: 'Inalámbrico, 4000 DPI, ergonómico', badge: 'Nuevo' },
    { id: 5, name: 'Teclado Mecánico Keychron K2', category: 'perifericos', price: 420000, image: '⌨️', description: 'Switch Red, TKL, Bluetooth/USB' },
    { id: 6, name: 'Auriculares HyperX Cloud II', category: 'perifericos', price: 380000, image: '🎧', description: 'Sonido 7.1, micrófono desmontable' },
    { id: 7, name: 'Procesador AMD Ryzen 7 7700X', category: 'componentes', price: 1450000, image: '💻', description: '8 núcleos, 4.5GHz boost, AM5', badge: 'Top' },
    { id: 8, name: 'GPU NVIDIA RTX 4070', category: 'componentes', price: 3200000, image: '🎮', description: '12GB GDDR6X, DLSS 3, ray tracing' },
    { id: 9, name: 'RAM Corsair 32GB DDR5', category: 'componentes', price: 580000, image: '🔧', description: 'DDR5 5600MHz, CL36, dual channel' },
    { id: 10, name: 'SSD Samsung 990 Pro 1TB', category: 'almacenamiento', price: 420000, image: '💾', description: 'NVMe PCIe 4.0, 7450MB/s lectura', badge: 'Oferta' },
    { id: 11, name: 'SSD WD Black 2TB', category: 'almacenamiento', price: 680000, image: '💾', description: 'NVMe PCIe 4.0, 7300MB/s lectura' },
    { id: 12, name: 'HDD Seagate 4TB', category: 'almacenamiento', price: 280000, image: '🗄️', description: '3.5" SATA, 7200RPM, caché 256MB' },
  ];

  constructor(private apiService: ApiService, private router: Router, private cdr: ChangeDetectorRef ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.apiService.isAuthenticated();
    if (this.isAuthenticated) {
      this.nombre = this.apiService.getNombre() || '';
      this.rol = this.apiService.getRol() || '';
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
        this.cartCount = this.cart.reduce((s, i) => s + i.qty, 0);
      }
    }
  }

  get filteredProducts(): Product[] {
    return this.products.filter(p => {
      const matchCat = this.selectedCategory === 'todos' || p.category === this.selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  get cartTotal(): number {
    return this.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.showLoginModal = true;
      return;
    }
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) existing.qty++;
    else this.cart.push({ product, qty: 1 });
    this.cartCount = this.cart.reduce((s, i) => s + i.qty, 0);
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  removeFromCart(id: number): void {
    this.cart = this.cart.filter(i => i.product.id !== id);
    this.cartCount = this.cart.reduce((s, i) => s + i.qty, 0);
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  closeModal(): void {
    this.showLoginModal = false;
    this.modalUsername = '';
    this.modalPassword = '';
    this.modalError = '';
  }

  toggleModalPassword(): void { this.modalShowPassword = !this.modalShowPassword; }

  modalLogin(): void {
  if (!this.modalUsername.trim() || !this.modalPassword.trim()) {
    this.modalError = 'Completa todos los campos.'; return;
  }
  this.modalLoading = true;
  this.modalError = '';

  this.apiService.login(this.modalUsername, this.modalPassword).subscribe({
    next: (res) => {
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('rol', res.rol);
      localStorage.setItem('username', res.username);
      localStorage.setItem('nombre', res.nombre);
      this.isAuthenticated = true;
      this.nombre = res.nombre;
      this.rol = res.rol;
      this.modalLoading = false;  
      this.closeModal();
    },
    error: (err) => {
        this.modalLoading = false;
        const msg = err.status === 401 ? 'Credenciales incorrectas.'
            : err.status === 403 ? (err.error?.detail || 'Usuario inactivo.')
            : 'Error de conexión.';
        Swal.fire({ icon: 'error', title: 'Acceso denegado', text: msg, confirmButtonColor: '#1a1a2e' });
        this.cdr.detectChanges();
        },
    complete: () => { this.modalLoading = false; }
  });
}

  logout(): void {
    this.apiService.logout();
    this.isAuthenticated = false;
    this.nombre = '';
    this.rol = '';
    this.cart = [];
    this.cartCount = 0;
    localStorage.removeItem('cart');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }
}