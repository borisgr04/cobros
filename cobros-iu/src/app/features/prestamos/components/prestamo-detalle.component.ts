import { Component, OnInit, signal, computed, inject, viewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PrestamoService, type PrestamoConCliente } from '../services';
import { AbstractPagoService } from '../../core/services/abstract-pago.service';
import type { CuotaProyectada } from '../utils/prestamo-calculations';
import type { IPago, IPrestamo } from '../../core/models';
import { RegistroPagoModalComponent } from './registro-pago-modal/registro-pago-modal.component';
import { EdicionPrestamoModalComponent } from './edicion-prestamo-modal/edicion-prestamo-modal.component';
import { ConfirmacionEliminarPrestamoModalComponent } from './confirmacion-eliminar-prestamo-modal/confirmacion-eliminar-prestamo-modal.component';

/**
 * Componente de detalle de un préstamo individual
 * Muestra información completa con tabs: Información, Pagos, Proyección
 */
@Component({
  selector: 'app-prestamo-detalle',
  standalone: true,
  imports: [CommonModule, RegistroPagoModalComponent, EdicionPrestamoModalComponent, ConfirmacionEliminarPrestamoModalComponent],
  templateUrl: './prestamo-detalle.component.html',
  styleUrl: './prestamo-detalle.component.scss',
})
export class PrestamoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private prestamoService = inject(PrestamoService);
  private pagoService = inject(AbstractPagoService);

  // ViewChild para acceder al modal de pago
  modalPago = viewChild(RegistroPagoModalComponent);
  
  // ViewChild para acceder al modal de edición
  modalEdicion = viewChild(EdicionPrestamoModalComponent);

  // ViewChild para acceder al modal de eliminación
  modalEliminar = viewChild(ConfirmacionEliminarPrestamoModalComponent);

  // Signals de datos
  prestamo = signal<PrestamoConCliente | null>(null);
  pagos = signal<IPago[]>([]);
  proyeccion = signal<CuotaProyectada[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string>('');

  // Signals de UI
  tabActiva = signal<'info' | 'pagos' | 'proyeccion'>('info');

  // Computed: Préstamo ID
  prestamoId = computed(() => {
    return this.route.snapshot.paramMap.get('id') || '';
  });

  ngOnInit(): void {
    this.cargarPrestamo();
  }

  /**
   * Carga los datos del préstamo
   */
  cargarPrestamo(): void {
    const id = this.prestamoId();
    if (!id) {
      this.error.set('ID de préstamo no válido');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    // Cargar préstamo y pagos en paralelo
    forkJoin({
      prestamo: this.prestamoService.getPrestamoConDatos(id),
      pagos: this.pagoService.getByPrestamo(id)
    }).subscribe({
      next: ({ prestamo, pagos }) => {
        if (!prestamo) {
          this.error.set('Préstamo no encontrado');
          this.cargando.set(false);
          return;
        }
        this.prestamo.set(prestamo);
        this.pagos.set(pagos);
        this.cargarProyeccion();
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar préstamo:', error);
        this.error.set('Error al cargar el préstamo');
        this.cargando.set(false);
      }
    });
  }

  /**
   * Carga la proyección de cuotas desde el backend
   */
  cargarProyeccion(): void {
    const id = this.prestamoId();
    if (!id) return;

    this.prestamoService.getCuotasDetalle(id).subscribe({
      next: (cuotas) => this.proyeccion.set(cuotas),
      error: () => {
        // Fallback: proyección local si el backend no responde
        const prestamo = this.prestamo();
        const pagos = this.pagos();
        if (prestamo) {
          this.proyeccion.set(this.prestamoService.generarProyeccion(prestamo, pagos));
        }
      }
    });
  }

  /**
   * Cambia la pestaña activa
   */
  cambiarTab(tab: 'info' | 'pagos' | 'proyeccion'): void {
    this.tabActiva.set(tab);
  }

  /**
   * Vuelve a la lista de préstamos
   */
  volver(): void {
    const navigationId = window.history.state?.navigationId ?? 0;
    if (navigationId > 1) {
      this.location.back();
      return;
    }
    this.router.navigate(['/prestamos']);
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Formatea una fecha completa
   */
  formatDateLong(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Obtiene el texto del filtro de frecuencia
   */
  getTextoFrecuencia(frecuencia: string): string {
    const textos: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return textos[frecuencia] || frecuencia;
  }

  /**
   * Obtiene la clase CSS para la barra de progreso
   */
  getProgressBarClass(porcentaje: number): string {
    if (porcentaje >= 100) return 'complete';
    if (porcentaje >= 50) return 'high';
    if (porcentaje >= 25) return 'medium';
    return 'low';
  }

  /**
   * Obtiene el número total de pagos registrados
   */
  getTotalPagos(): number {
    return this.pagos().length;
  }

  /** Suma los primeros N pagos para calcular el saldo acumulado pagado */
  calcularSaldoAcumulado(n: number): number {
    return this.pagos().slice(0, n).reduce((sum, p) => sum + p.valor, 0);
  }

  /**
   * Calcula la tasa de interés como porcentaje del valor prestado
   * @param valorPrestado Valor principal del préstamo
   * @param interes Interés total proyectado
   * @returns Porcentaje de interés redondeado
   */
  calcularTasaInteres(valorPrestado: number, interes: number): number {
    if (valorPrestado === 0) return 0;
    return Math.round((interes / valorPrestado) * 100);
  }

  /**
   * Abre el modal de pago
   */
  abrirModalPago(): void {
    const modal = this.modalPago();
    const prestamo = this.prestamo();
    if (modal && prestamo) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el evento de pago registrado exitosamente
   */
  onPagoRegistrado(pago: IPago): void {
    // Recargar datos del préstamo
    this.cargarPrestamo();
  }

  /**
   * Verifica si el préstamo puede ser editado (sin pagos registrados)
   */
  puedeEditarPrestamo(): boolean {
    const totalPagos = this.getTotalPagos();
    return totalPagos === 0;
  }

  /**
   * Abre el modal de edición del préstamo
   */
  editarPrestamo(): void {
    const prestamo = this.prestamo();
    const totalPagos = this.getTotalPagos();

    // Validar que no tenga pagos
    if (totalPagos > 0) {
      alert('No se puede editar un préstamo con pagos registrados');
      return;
    }

    if (!prestamo) {
      alert('No se pudo cargar la información del préstamo');
      return;
    }

    const modal = this.modalEdicion();
    if (modal) {
      modal.abrir(prestamo);
    }
  }

  /**
   * Maneja el evento de préstamo actualizado exitosamente
   */
  onPrestamoActualizado(prestamo: IPrestamo): void {
    console.log('Préstamo actualizado:', prestamo);
    // Recargar datos del préstamo
    this.cargarPrestamo();
  }

  /**
   * Verifica si el préstamo puede ser eliminado (sin pagos registrados)
   */
  puedeEliminarPrestamo(): boolean {
    const totalPagos = this.getTotalPagos();
    return totalPagos === 0;
  }

  /**
   * Abre el modal de confirmación de eliminación del préstamo
   */
  eliminarPrestamo(): void {
    const prestamo = this.prestamo();
    const totalPagos = this.getTotalPagos();

    // Validar que no tenga pagos
    if (totalPagos > 0) {
      alert('⚠️ No se puede eliminar un préstamo con pagos registrados\n\n' +
            `Este préstamo tiene ${totalPagos} pago(s) registrado(s).\n` +
            'Debes eliminar todos los pagos antes de eliminar el préstamo.');
      return;
    }

    if (!prestamo) {
      alert('No se pudo cargar la información del préstamo');
      return;
    }

    const modal = this.modalEliminar();
    if (modal) {
      modal.abrir(prestamo, totalPagos);
    }
  }

  /**
   * Maneja el evento de préstamo eliminado exitosamente
   * El modal se encarga de la navegación, este método es por si necesitamos lógica adicional
   */
  onPrestamoEliminado(prestamoId: string): void {
    console.log('Préstamo eliminado:', prestamoId);
    // El modal ya navega a /prestamos, aquí podríamos agregar lógica adicional si fuera necesario
  }
}
