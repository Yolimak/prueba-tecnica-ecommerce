import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  // ── AUTH ─────────────────────────────────────────────────────────
  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    return this.http.post<any>(`${this.baseUrl}/auth/login`, body.toString(),
      { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) });
  }

  register(nombre: string, username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, { nombre, username, password, rol: 'cliente' });
  }

  adminCreateUser(nombre: string, username: string, password: string, rol: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/admin/register`, { nombre, username, password, rol }, { headers: this.authHeaders() });
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getRol(): string | null { return localStorage.getItem('rol'); }
  getUsername(): string | null { return localStorage.getItem('username'); }
  getNombre(): string | null { return localStorage.getItem('nombre'); }
  isAuthenticated(): boolean { return !!this.getToken(); }
  isAdmin(): boolean { return this.getRol() === 'admin'; }
  isModerador(): boolean { return this.getRol() === 'moderador'; }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }
// ── USERS ────────────────────────────────────────────────────────
getAllUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/auth/users`, { headers: this.authHeaders() });
}
toggleUserStatus(id: number): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/auth/users/${id}/status`, {}, { headers: this.authHeaders() });
}
deleteUser(id: number): Observable<any> {
  return this.http.delete<any>(`${this.baseUrl}/auth/users/${id}`, { headers: this.authHeaders() });
}
  // ── CATEGORIES ───────────────────────────────────────────────────
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }
  getAllCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories/all`, { headers: this.authHeaders() });
  }
  createCategory(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/categories`, data, { headers: this.authHeaders() });
  }
  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/categories/${id}`, data, { headers: this.authHeaders() });
  }
  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/categories/${id}`, { headers: this.authHeaders() });
  }

  // ── PRODUCTS ─────────────────────────────────────────────────────
  getProducts(categoryId?: number): Observable<any[]> {
    const url = categoryId ? `${this.baseUrl}/products?category_id=${Number(categoryId)}` : `${this.baseUrl}/products`;
    return this.http.get<any[]>(url);
  }
  getAllProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/all`, { headers: this.authHeaders() });
  }
  createProduct(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/products`, data, { headers: this.authHeaders() });
  }
  updateProduct(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/products/${id}`, data, { headers: this.authHeaders() });
  }
  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/products/${id}`, { headers: this.authHeaders() });
  }

  // ── CART ─────────────────────────────────────────────────────────
  getCart(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cart`, { headers: this.authHeaders() });
  }
  addToCart(id_product: number, quantity: number = 1): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cart/add`, { id_product, quantity }, { headers: this.authHeaders() });
  }
  updateCartItem(id_item: number, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/cart/item/${id_item}`, { quantity }, { headers: this.authHeaders() });
  }
  removeCartItem(id_item: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/item/${id_item}`, { headers: this.authHeaders() });
  }
  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/clear`, { headers: this.authHeaders() });
  }
  getAllCarts(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/cart/all`, { headers: this.authHeaders() });
  }
  clearCartByAdmin(id_cart: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/admin/${id_cart}`, { headers: this.authHeaders() });
  }
   // ── ORDERS ───────────────────────────────────────────────────────
  createOrder(data: { def_address: string; cod_payment: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders`, data, { headers: this.authHeaders() });
  }
  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/orders/my`, { headers: this.authHeaders() });
  }
  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/orders/all`, { headers: this.authHeaders() });
  }
  updateOrderStatus(id_order: number, status: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/orders/${id_order}/status`, { status }, { headers: this.authHeaders() });
  }
  
}