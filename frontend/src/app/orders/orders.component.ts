import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';

interface OrderItem {
  id_item: number; id_product: number; des_product: string;
  quantity: number; cod_value: number; cod_iva: number;
  subtotal_item: number; iva_item: number; total_item: number;
}
interface Order {
  id_order: number; cod_order: string; status: number; status_label: string;
  def_address: string; cod_payment: string; payment_label: string;
  subtotal: number; total_iva: number; total: number; notes: string;
  created_at: string; items: OrderItem[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  expandedOrder: number | null = null;
  nombre = '';

  statusColors: { [key: number]: string } = {
    1: 'status-pending', 2: 'status-confirmed', 3: 'status-shipped',
    4: 'status-delivered', 5: 'status-cancelled'
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.nombre = this.apiService.getNombre() || '';
    this.apiService.getMyOrders().subscribe({
      next: (data) => { this.orders = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  toggleOrder(id: number): void { this.expandedOrder = this.expandedOrder === id ? null : id; }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: number): string { return this.statusColors[status] || ''; }
}