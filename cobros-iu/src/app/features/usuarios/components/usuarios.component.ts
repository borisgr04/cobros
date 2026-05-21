import { Component, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TopHeaderComponent } from '../../../shared/components/top-header/top-header.component';

interface Usuario {
  id: number;
  email: string;
  nombre: string | null;
  fotoUrl: string | null;
  autorizado: boolean;
  creadoEn: string;
  ultimoAcceso: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, TopHeaderComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  usuarios  = signal<Usuario[]>([]);
  loading   = signal(true);
  error     = signal<string | null>(null);
  saving    = signal<number | null>(null); // id del usuario guardando
  deleting  = signal<number | null>(null); // id del usuario eliminando

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Usuario[]>('/api/usuarios').subscribe({
      next: (data) => { this.usuarios.set(data); this.loading.set(false); },
      error: ()    => { this.error.set('No se pudieron cargar los usuarios.'); this.loading.set(false); }
    });
  }

  toggleAutorizacion(u: Usuario): void {
    this.saving.set(u.id);
    this.http.patch<Usuario>(`/api/usuarios/${u.id}/autorizacion`, { autorizado: !u.autorizado }).subscribe({
      next: (updated) => {
        this.usuarios.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.saving.set(null);
      },
      error: () => { this.error.set('Error al actualizar.'); this.saving.set(null); }
    });
  }

  eliminarUsuario(u: Usuario): void {
    const nombre = u.nombre ?? u.email;
    if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;

    this.deleting.set(u.id);
    this.http.delete(`/api/usuarios/${u.id}`).subscribe({
      next: () => {
        this.usuarios.update(list => list.filter(x => x.id !== u.id));
        this.deleting.set(null);
      },
      error: () => { this.error.set('Error al eliminar el usuario.'); this.deleting.set(null); }
    });
  }
}
