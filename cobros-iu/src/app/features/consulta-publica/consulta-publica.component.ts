import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

interface PrestamoPublico {
  id: number;
  fechaPrestamo: string;
  fechaFinal: string;
  valorPrestado: number;
  valorTotal: number;
  valorCuota: number;
  frecuenciaPago: string;
  cantidadCuotas: number;
  cuotasPagadas: number;
  totalPagado: number;
  saldoPendiente: number;
  ultimoPago: string | null;
}

interface ConsultaPublica {
  nombre: string;
  alias: string | null;
  prestamos: PrestamoPublico[];
}

@Component({
  selector: 'app-consulta-publica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consulta-publica.component.html',
  styleUrl: './consulta-publica.component.scss'
})
export class ConsultaPublicaComponent implements OnInit {
  consulta  = signal<ConsultaPublica | null>(null);
  loading   = signal(true);
  error     = signal<string | null>(null);
  fechaHoy  = new Date();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const llave = this.route.snapshot.paramMap.get('llave');
    if (!llave) { this.error.set('Enlace inválido.'); this.loading.set(false); return; }

    const url = `${environment.apiUrl}/api/consulta/${llave}`;
    this.http.get<ConsultaPublica>(url).subscribe({
      next: (data) => { this.consulta.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.status === 404
          ? 'No se encontró la consulta. Verificá el enlace.'
          : 'Error al cargar la información. Intentá nuevamente.');
        this.loading.set(false);
      }
    });
  }

  get totalSaldo(): number {
    return this.consulta()?.prestamos.reduce((s, p) => s + p.saldoPendiente, 0) ?? 0;
  }

  get totalPagado(): number {
    return this.consulta()?.prestamos.reduce((s, p) => s + p.totalPagado, 0) ?? 0;
  }

  progreso(p: PrestamoPublico): number {
    return p.cantidadCuotas > 0
      ? Math.min(100, Math.round((p.cuotasPagadas / p.cantidadCuotas) * 100))
      : 0;
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(value);
  }

  fmtFecha(fecha: string | null): string {
    if (!fecha) return '—';
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(fecha));
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
