import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  nombre = '';
  username = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(private apiService: ApiService, private router: Router,private cdr: ChangeDetectorRef) {}

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.nombre.trim()) {
      this.errorMessage = 'Por favor ingresa tu nombre completo.'; return;
    }
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Por favor completa todos los campos.'; return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.'; return;
    }
    if (this.password.length < 4) {
      this.errorMessage = 'La contraseña debe tener al menos 4 caracteres.'; return;
    }

    this.isLoading = true;
    this.apiService.register(this.nombre, this.username, this.password).subscribe({
      next: () => {
        Swal.fire({ 
            icon: 'success', 
            title: '¡Cuenta creada!', 
            text: 'Redirigiendo al login...', 
            timer: 1800, 
            showConfirmButton: false,
            confirmButtonColor: '#1a1a2e'
        });
  setTimeout(() => this.router.navigate(['/login']), 1800);
        },
            error: (err) => {
        this.isLoading = false;
        const msg = err.status === 409 ? 'Ese nombre de usuario ya está en uso.'
            : err.status === 400 ? (err.error?.detail || 'Datos inválidos.')
            : 'Error al registrar. Inténtalo de nuevo.';
        Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#1a1a2e' });
        this.cdr.detectChanges();        
        },
      complete: () => { this.isLoading = false; }
    });
  }
}