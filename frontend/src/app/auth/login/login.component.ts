import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(private apiService: ApiService, private router: Router,private cdr: ChangeDetectorRef) {}

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Por favor completa todos los campos.'; return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.login(this.username, this.password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('rol', res.rol);
        localStorage.setItem('username', res.username);
        localStorage.setItem('nombre', res.nombre);
        this.router.navigate(['/home']);
      },
        error: (err) => {
  this.isLoading = false;
  const msg = err.status === 401 ? 'Credenciales incorrectas.' 
    : err.status === 403 ? (err.error?.detail || 'Usuario inactivo.')
    : 'Error de conexión. Verifica que el servidor esté activo.';
  Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#1a1a2e' });
  this.cdr.detectChanges();
},
      complete: () => { this.isLoading = false; }
    });
  }
}