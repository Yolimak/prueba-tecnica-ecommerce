import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ access_token: string; rol: string; username: string; nombre: string }> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    return this.http.post<any>(`${this.baseUrl}/login`, body.toString(),
      { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) });
  }

  register(nombre: string, username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, { nombre, username, password, rol: 'cliente' });
  }

  adminCreateUser(nombre: string, username: string, password: string, rol: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/register`,
      { nombre, username, password, rol },
      { headers: this.authHeaders() }
    );
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

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products`, { headers: this.authHeaders() });
  }
  createProduct(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/products`, data, { headers: this.authHeaders() });
  }
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`, { headers: this.authHeaders() });
  }
}