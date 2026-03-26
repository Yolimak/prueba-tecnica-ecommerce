import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  cod_name: string;
  des_category: string;
  status: number;
}
interface CartItem {
  id_item: number; id_product: number; des_product: string; img_product: string;
  quantity: number; cod_value: number; cod_iva: number;
  subtotal_item: number; iva_item: number; total_item: number;
}
interface UserCart {
  id_cart: number; username: string; nombre: string; user_id: number;
  updated_at: string; items: CartItem[];
  resumen: { subtotal: number; total_iva: number; total: number; cantidad_items: number; };
}
interface Order {
  id_order: number; cod_order: string; status: number; status_label: string;
  def_address: string; cod_payment: string; payment_label: string;
  subtotal: number; total_iva: number; total: number; notes: string;
  created_at: string; username: string; nombre: string;
  items: any[];
}
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
interface AppUser {
  id: number; username: string; nombre: string; rol: string; status: number;
}
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {

  activeTab = 'categories';
  nombre = '';
  rol = '';
  cartSearch = '';
  
  
  // ── CATEGORIES ────────────────────────────
  categories: Category[] = [];
  showCatModal = false;
  editingCat: Category | null = null;
  catForm = { cod_name: '', des_category: '' };

  // ── PRODUCTS ──────────────────────────────
  products: Product[] = [];
  
  showProdModal = false;
  editingProd: Product | null = null;
  prodForm = {
    id_category: 0, des_product: '', def_product: '',
    cod_value: 0, cod_iva: 19.00, img_product: '', status: 1, cod_tag: 1
  };
  // orders 
  orders: Order[] = [];
  expandedOrder: number | null = null;
  orderSearch = '';
  orderStatusFilter = 0;

  //user
  users: AppUser[] = [];
  userSearch = '';
  showUserModal = false;
  userForm = { nombre: '', username: '', password: '', rol: 'cliente' };

  imgPreview = '';
  carts: UserCart[] = [];          
    expandedCart: number | null = null; 
  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.apiService.isAuthenticated()) {
      this.router.navigate(['/login']); return;
    }
    const rol = this.apiService.getRol();
    if (rol !== 'admin' && rol !== 'moderador') {
      this.router.navigate(['/home']); return;
    }
    this.nombre = this.apiService.getNombre() || '';
    this.rol = rol || '';
    this.loadCategories();
    this.loadProducts();
  }

  // ── LOAD ───────────────────────────────────
  loadCategories(): void {
    this.apiService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las categorías', confirmButtonColor: '#1a1a2e' })
    });
  }

  loadProducts(): void {
    this.apiService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los productos', confirmButtonColor: '#1a1a2e' })
    });
  }

  // ── CATEGORIES CRUD ────────────────────────
  openCatModal(cat?: Category): void {
    this.editingCat = cat || null;
    this.catForm = cat
      ? { cod_name: cat.cod_name, des_category: cat.des_category || '' }
      : { cod_name: '', des_category: '' };
    this.showCatModal = true;
  }

  closeCatModal(): void { this.showCatModal = false; this.editingCat = null; }

  saveCat(): void {
    if (!this.catForm.cod_name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El nombre de la categoría es obligatorio', confirmButtonColor: '#1a1a2e' }); return;
    }
    const obs = this.editingCat
      ? this.apiService.updateCategory(this.editingCat.id, this.catForm)
      : this.apiService.createCategory(this.catForm);

    obs.subscribe({
      next: () => {
        this.closeCatModal();
        this.loadCategories();
        Swal.fire({ icon: 'success', title: this.editingCat ? 'Categoría actualizada' : 'Categoría creada', timer: 1500, showConfirmButton: false });
      },
      error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'Error al guardar', confirmButtonColor: '#1a1a2e' })
    });
  }

  deleteCat(cat: Category): void {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `"${cat.cod_name}" será eliminada permanentemente`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e94560', cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteCategory(cat.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
            this.loadCategories();
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'No se pudo eliminar', confirmButtonColor: '#1a1a2e' })
        });
      }
    });
  }

  toggleCatStatus(cat: Category): void {
    const newStatus = cat.status === 1 ? 0 : 1;
    this.apiService.updateCategory(cat.id, { status: newStatus }).subscribe({
      next: () => { cat.status = newStatus; this.cdr.detectChanges(); },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado', confirmButtonColor: '#1a1a2e' })
    });
  }

  // ── PRODUCTS CRUD ──────────────────────────
  openProdModal(prod?: Product): void {
    this.editingProd = prod || null;
    this.prodForm = prod ? {
      id_category: prod.id_category,
      des_product: prod.des_product,
      def_product: prod.def_product || '',
      cod_value: prod.cod_value,
      cod_iva: prod.cod_iva,
      img_product: prod.img_product || '',
      status: prod.status,
      cod_tag: prod.cod_tag
    } : {
      id_category: this.categories[0]?.id || 0,
      des_product: '', def_product: '',
      cod_value: 0, cod_iva: 19.00,
      img_product: '', status: 1, cod_tag: 1
    };
    this.imgPreview = this.prodForm.img_product || '';
    this.showProdModal = true;
  }

  closeProdModal(): void { this.showProdModal = false; this.editingProd = null; this.imgPreview = ''; }

  onImageChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'Imagen muy grande', text: 'La imagen no debe superar 2MB', confirmButtonColor: '#1a1a2e' }); return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.prodForm.img_product = e.target.result;
      this.imgPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  saveProd(): void {
    if (!this.prodForm.des_product.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El nombre del producto es obligatorio', confirmButtonColor: '#1a1a2e' }); return;
    }
    if (!this.prodForm.cod_value || this.prodForm.cod_value <= 0) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El valor debe ser mayor a 0', confirmButtonColor: '#1a1a2e' }); return;
    }

    const payload = {
      ...this.prodForm,
      cod_value: parseFloat(this.prodForm.cod_value.toString()),
      cod_iva: parseFloat(this.prodForm.cod_iva.toString()),
      id_category: parseInt(this.prodForm.id_category.toString()),
      status: parseInt(this.prodForm.status.toString()),
      cod_tag: parseInt(this.prodForm.cod_tag.toString()),
    };

    const obs = this.editingProd
      ? this.apiService.updateProduct(this.editingProd.id, payload)
      : this.apiService.createProduct(payload);

    obs.subscribe({
      next: () => {
        this.closeProdModal();
        this.loadProducts();
        Swal.fire({ icon: 'success', title: this.editingProd ? 'Producto actualizado' : 'Producto creado', timer: 1500, showConfirmButton: false });
      },
      error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'Error al guardar', confirmButtonColor: '#1a1a2e' })
    });
  }

  deleteProd(prod: Product): void {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `"${prod.des_product}" será eliminado permanentemente`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e94560', cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteProduct(prod.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
            this.loadProducts();
          },
          error: (err) => {
            const msg = err.error?.detail || 'No se pudo eliminar';
            Swal.fire({ 
                icon: err.status === 409 ? 'warning' : 'error', 
                title: err.status === 409 ? 'No se puede eliminar' : 'Error', 
                text: msg, 
                confirmButtonColor: '#1a1a2e' 
            });
            }
        });
      }
    });
  }

  toggleProdStatus(prod: Product): void {
    const newStatus = prod.status === 1 ? 2 : 1;
    this.apiService.updateProduct(prod.id, { status: newStatus }).subscribe({
      next: () => { prod.status = newStatus; this.cdr.detectChanges(); },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado', confirmButtonColor: '#1a1a2e' })
    });
  }
  loadCarts(): void {
  this.apiService.getAllCarts().subscribe({
    next: (data) => { this.carts = data; this.cdr.detectChanges(); },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los carritos', confirmButtonColor: '#1a1a2e' })
  });
}
get filteredCarts(): UserCart[] {
  if (!this.cartSearch.trim()) return this.carts;
  const q = this.cartSearch.toLowerCase();
  return this.carts.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.username.toLowerCase().includes(q)
  );
}

onTabChange(tab: string): void {
  this.activeTab = tab;
  if (tab === 'carts') this.loadCarts();
  if (tab === 'orders') this.loadOrders(); 
  if (tab === 'users') this.loadUsers();
}

toggleCart(id: number): void {
  this.expandedCart = this.expandedCart === id ? null : id;
}
clearUserCart(cart: UserCart): void {
  Swal.fire({
    title: '¿Vaciar carrito?',
    text: `Se eliminarán todos los productos del carrito de ${cart.nombre}`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#e94560', cancelButtonColor: '#aaa',
    confirmButtonText: 'Sí, vaciar', cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.apiService.clearCartByAdmin(cart.id_cart).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Carrito vaciado', timer: 1500, showConfirmButton: false });
          this.loadCarts();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'No se pudo vaciar', confirmButtonColor: '#1a1a2e' })
      });
    }
  });
}
loadOrders(): void {
  this.apiService.getAllOrders().subscribe({
    next: (data) => { this.orders = data; this.cdr.detectChanges(); },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los pedidos', confirmButtonColor: '#1a1a2e' })
  });
}

get filteredOrders(): Order[] {
  let result = this.orders;
  if (this.orderStatusFilter > 0)
    result = result.filter(o => o.status === this.orderStatusFilter);
  if (this.orderSearch.trim())
    result = result.filter(o =>
      o.cod_order.toLowerCase().includes(this.orderSearch.toLowerCase()) ||
      o.nombre.toLowerCase().includes(this.orderSearch.toLowerCase()) ||
      o.username.toLowerCase().includes(this.orderSearch.toLowerCase())
    );
  return result;
}

toggleOrder(id: number): void {
  this.expandedOrder = this.expandedOrder === id ? null : id;
}

changeOrderStatus(order: Order, status: number): void {
  this.apiService.updateOrderStatus(order.id_order, status).subscribe({
    next: () => {
      order.status = status;
      order.status_label = this.getStatusLabel(status);
      this.cdr.detectChanges();
      Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1200, showConfirmButton: false });
    },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar', confirmButtonColor: '#1a1a2e' })
  });
}
loadUsers(): void {
  this.apiService.getAllUsers().subscribe({
    next: (data) => { this.users = data; this.cdr.detectChanges(); },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los usuarios', confirmButtonColor: '#1a1a2e' })
  });
}

get filteredUsers(): AppUser[] {
  if (!this.userSearch.trim()) return this.users;
  const q = this.userSearch.toLowerCase();
  return this.users.filter(u =>
    u.nombre.toLowerCase().includes(q) ||
    u.username.toLowerCase().includes(q) ||
    u.rol.toLowerCase().includes(q)
  );
}

openUserModal(): void {
  this.userForm = { nombre: '', username: '', password: '', rol: 'cliente' };
  this.showUserModal = true;
}

closeUserModal(): void { this.showUserModal = false; }

saveUser(): void {
  if (!this.userForm.nombre.trim() || !this.userForm.username.trim() || !this.userForm.password.trim()) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos', confirmButtonColor: '#1a1a2e' }); return;
  }
  this.apiService.adminCreateUser(this.userForm.nombre, this.userForm.username, this.userForm.password, this.userForm.rol).subscribe({
    next: () => {
      this.closeUserModal();
      this.loadUsers();
      Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false });
    },
    error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'Error al crear', confirmButtonColor: '#1a1a2e' })
  });
}

toggleUserStatus(user: AppUser): void {
  if (user.rol === 'admin') { Swal.fire({ icon: 'warning', title: 'No permitido', text: 'No puedes cambiar el estado de un admin', confirmButtonColor: '#1a1a2e' }); return; }
  this.apiService.toggleUserStatus(user.id).subscribe({
    next: (res) => { user.status = res.status; this.cdr.detectChanges(); },
    error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'No se pudo cambiar', confirmButtonColor: '#1a1a2e' })
  });
}

deleteUser(user: AppUser): void {
  Swal.fire({
    title: '¿Eliminar usuario?', text: `"${user.nombre}" será eliminado permanentemente`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#e94560',
    cancelButtonColor: '#aaa', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
  }).then((r) => {
    if (r.isConfirmed) {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => { Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false }); this.loadUsers(); },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.detail || 'No se pudo eliminar', confirmButtonColor: '#1a1a2e' })
      });
    }
  });
}

getRolClass(rol: string): string {
  const map: { [k: string]: string } = { admin: 'badge-admin', moderador: 'badge-mod', cliente: 'badge-cliente' };
  return map[rol] || '';
}
getStatusLabel(status: number): string {
  const map: { [k: number]: string } = { 1: 'Pendiente de pago', 2: 'Confirmado', 3: 'Enviado', 4: 'Entregado', 5: 'Cancelado' };
  return map[status] || '';
}

getStatusClass(status: number): string {
  const map: { [k: number]: string } = { 1: 'status-pending', 2: 'status-confirmed', 3: 'status-shipped', 4: 'status-delivered', 5: 'status-cancelled' };
  return map[status] || '';
}
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }
  getTagLabel(tag: number): string {
  const tags: { [key: number]: string } = {
    1: '—', 2: 'Nuevo', 3: 'Más vendido', 4: 'Oferta', 5: 'Top'
  };
  return tags[tag] || '—';
}

  logout(): void { this.apiService.logout(); this.router.navigate(['/home']); }
}