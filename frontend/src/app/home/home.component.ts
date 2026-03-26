import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  id_category: number;
  des_product: string;
  def_product: string;
  cod_value: number;
  cod_iva: number;
  img_product: string;
  status: number;
  cod_tag: number;
  category_name: string;
}

interface Category {
  id: number;
  cod_name: string;
  des_category: string;
}

interface CartItem {
  id_item: number;
  id_product: number;
  des_product: string;
  img_product: string;
  category_name: string;
  quantity: number;
  cod_value: number;
  cod_iva: number;
  subtotal_item: number;
  iva_item: number;
  total_item: number;
}

interface CartResumen {
  subtotal: number;
  total_iva: number;
  total: number;
  cantidad_items: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  // ── AUTH ───────────────────────────────────
  isAuthenticated = false;
  nombre = '';
  rol = '';

  // ── MODAL LOGIN ────────────────────────────
  showLoginModal = false;
  modalUsername = '';
  modalPassword = '';
  modalLoading = false;
  modalError = '';
  modalShowPassword = false;

  // ── CART ───────────────────────────────────
  cartItems: CartItem[] = [];
  cartResumen: CartResumen = { subtotal: 0, total_iva: 0, total: 0, cantidad_items: 0 };
  showCart = false;
  cartLoading = false;
 // ── CHECKOUT ───────────────────────────────  ← agregar esto
  showCheckout = false;
  checkoutForm = { def_address: '', cod_payment: 'efectivo', notes: '' };
  checkoutLoading = false;
  // ── PRODUCTS & CATEGORIES ──────────────────
  selectedCategory = 0;
  searchQuery = '';
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;

  tagMap: { [key: number]: string } = { 1: '', 2: 'Nuevo', 3: 'Más vendido', 4: 'Oferta', 5: 'Top' };
  tagColorMap: { [key: number]: string } = { 2: 'tag-nuevo', 3: 'tag-vendido', 4: 'tag-oferta', 5: 'tag-top' };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.apiService.isAuthenticated();
    if (this.isAuthenticated) {
      this.nombre = this.apiService.getNombre() || '';
      this.rol = this.apiService.getRol() || '';
      this.loadCart();
    }
    this.loadCategories();
    this.loadProducts();
  }

  // ── CART ───────────────────────────────────
  loadCart(): void {
    this.apiService.getCart().subscribe({
      next: (data) => {
        this.cartItems = data.items || [];
        this.cartResumen = data.resumen || { subtotal: 0, total_iva: 0, total: 0, cantidad_items: 0 };
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  get cartCount(): number { return this.cartResumen.cantidad_items; }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) { this.showLoginModal = true; return; }
    this.cartLoading = true;
    this.apiService.addToCart(product.id, 1).subscribe({
      next: (data) => {
        this.cartItems = data.items;
        this.cartResumen = data.resumen;
        this.cartLoading = false;
        this.showCart = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cartLoading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'No se pudo agregar al carrito', confirmButtonColor: '#1a1a2e' });
      }
    });
  }

  updateQty(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty <= 0) { this.removeItem(item); return; }
    this.apiService.updateCartItem(item.id_item, newQty).subscribe({
      next: (data) => {
        this.cartItems = data.items;
        this.cartResumen = data.resumen;
        this.cdr.detectChanges();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar', confirmButtonColor: '#1a1a2e' })
    });
  }

  removeItem(item: CartItem): void {
    this.apiService.removeCartItem(item.id_item).subscribe({
      next: (data) => {
        this.cartItems = data.items;
        this.cartResumen = data.resumen;
        this.cdr.detectChanges();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar', confirmButtonColor: '#1a1a2e' })
    });
  }

  clearCart(): void {
    Swal.fire({
      title: '¿Vaciar carrito?',
      text: 'Se eliminarán todos los productos',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e94560', cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, vaciar', cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.clearCart().subscribe({
          next: (data) => {
            this.cartItems = [];
            this.cartResumen = { subtotal: 0, total_iva: 0, total: 0, cantidad_items: 0 };
            this.cdr.detectChanges();
          },
          error: () => {}
        });
      }
    });
  }

  openCheckout(): void {
  this.showCart = false;
  this.checkoutForm = { def_address: '', cod_payment: 'efectivo', notes: '' };
  this.showCheckout = true;
  this.cdr.detectChanges(); 
}

closeCheckout(): void { this.showCheckout = false;this.cdr.detectChanges();  }

submitOrder(): void {
  if (!this.checkoutForm.def_address.trim()) {
    Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Ingresa la dirección de envío', confirmButtonColor: '#1a1a2e' }); return;
  }
  this.checkoutLoading = true;
  this.apiService.createOrder(this.checkoutForm).subscribe({
    next: (order) => {
      this.checkoutLoading = false;
      this.showCheckout = false;
      this.cartItems = [];
      this.cartResumen = { subtotal: 0, total_iva: 0, total: 0, cantidad_items: 0 };
      this.cdr.detectChanges();
      Swal.fire({
        icon: 'success', title: '¡Pedido creado!',
        html: `Tu pedido <strong>${order.cod_order}</strong> fue registrado.<br>Total: <strong>${this.formatPrice(order.total)}</strong>`,
        confirmButtonText: 'Ver mis pedidos', confirmButtonColor: '#1a1a2e',
        showCancelButton: true, cancelButtonText: 'Seguir comprando', cancelButtonColor: '#aaa'
      }).then((r) => { if (r.isConfirmed) this.router.navigate(['/orders']); });
    },
    error: (err) => {
      this.checkoutLoading = false;
      Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'No se pudo crear el pedido', confirmButtonColor: '#1a1a2e' });
    }
  });
}

  // ── PRODUCTS ───────────────────────────────
  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (data) => { this.categories = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.isLoading = this.products.length === 0;
    const catId = this.selectedCategory > 0 ? this.selectedCategory : undefined;
    this.apiService.getProducts(catId).subscribe({
      next: (data) => { this.products = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); },
      complete: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  onCategoryChange(id: number): void {
    this.selectedCategory = id;
    this.loadProducts();
  }

  get filteredProducts(): Product[] {
    if (!this.searchQuery.trim()) return this.products;
    return this.products.filter(p =>
      p.des_product.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      p.category_name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  getTagLabel(tag: number): string { return this.tagMap[tag] || ''; }
  getTagClass(tag: number): string { return this.tagColorMap[tag] || ''; }

  // ── MODAL LOGIN ────────────────────────────
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
        this.loadCart();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.modalLoading = false;
        if (err.status === 401) {
          this.modalError = 'Credenciales incorrectas.';
          Swal.fire({ icon: 'error', title: 'Error', text: 'Credenciales incorrectas.', confirmButtonColor: '#1a1a2e' });
        } else if (err.status === 403) {
          this.modalError = typeof err.error?.detail === 'string' ? err.error.detail : 'Usuario inactivo.';
          Swal.fire({ icon: 'error', title: 'Acceso denegado', text: this.modalError, confirmButtonColor: '#1a1a2e' });
        } else {
          this.modalError = 'Error de conexión.';
          Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión.', confirmButtonColor: '#1a1a2e' });
        }
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.apiService.logout();
    this.isAuthenticated = false;
    this.nombre = '';
    this.rol = '';
    this.cartItems = [];
    this.cartResumen = { subtotal: 0, total_iva: 0, total: 0, cantidad_items: 0 };
    this.showCart = false;
    this.cdr.detectChanges();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }
}