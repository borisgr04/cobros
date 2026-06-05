import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { AbreviarMonedaPipe } from '../../../../shared/pipes/abreviar-moneda.pipe';
import type { CierreDia } from '../../models/reporte.models';

@Component({
  selector: 'app-cierre-dia',
  standalone: true,
  imports: [CommonModule, FormsModule, AbreviarMonedaPipe],
  templateUrl: './cierre-dia.component.html',
  styleUrl: './cierre-dia.component.scss'
})
export class CierreDiaComponent {
  private reporteService = inject(ReporteService);

  fecha = signal<string>(this.hoyISO());
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  datos = signal<CierreDia | null>(null);

  constructor() {
    effect(() => {
      const f = this.fecha();
      this.cargar(f);
    });
  }

  private hoyISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  cargar(fecha: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.getCierreDia(fecha).subscribe({
      next: res => {
        this.datos.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte. Verifica la conexión e intenta de nuevo.');
        this.cargando.set(false);
      }
    });
  }

  reintentar(): void {
    this.cargar(this.fecha());
  }

  onFechaChange(valor: string): void {
    this.fecha.set(valor);
  }

  sinActividad(): boolean {
    const d = this.datos();
    if (!d) return false;
    return d.ganancia.interesesPactadosTotal === 0
      && d.prestamosDia.nuevosCount === 0
      && d.prestamosDia.renovadosCount === 0
      && d.cobros.recaudadoTotal === 0;
  }
}
