import { Component, OnInit, signal, viewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import type { ICliente, IZona, FrecuenciaPago } from '../../../core/models';
import { AbstractClienteService } from '../../../core/services/abstract-cliente.service';
import { AbstractZonaService } from '../../../core/services/abstract-zona.service';
import { PrestamoService, type PrestamoConCliente } from '../../../prestamos/services/prestamo.service';
import { RegistroPrestamoModalComponent } from '../../../prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component';
import { RegistroPagoModalComponent } from '../../../prestamos/components/registro-pago-modal/registro-pago-modal.component';

/**
 * Vista de detalle de un cliente: muestra datos completos del cliente
 * y la lista de sus préstamos activos con acciones.
 */
@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, RegistroPrestamoModalComponent, RegistroPagoModalComponent],
  templateUrl: './cliente-detalle.component.html',
  styleUrl: './cliente-detalle.component.scss',
})
export class ClienteDetalleComponent implements OnInit {
  modalPrestamo = viewChild(RegistroPrestamoModalComponent);
  modalPago = viewChild(RegistroPagoModalComponent);

  cliente = signal<ICliente | null>(null);
  zonas = signal<IZona[]>([]);
  prestamos = signal<PrestamoConCliente[]>([]);
  cargando = signal<boolean>(false);
  cargandoPrestamos = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private clienteService: AbstractClienteService,
    private zonaService: AbstractZonaService,
    private prestamoService: PrestamoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.zonaService.getActivas().subscribe({ next: z => this.zonas.set(z) });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCliente(id);
    } else {
      this.error.set('Cliente no encontrado');
    }
  }

  cargarCliente(id: string): void {
    this.cargando.set(true);
    this.clienteService.getConPrestamosActivos(id).subscribe({
      next: (resultado) => {
        this.cliente.set(resultado);
        this.cargando.set(false);
        this.cargarEstadisticasPrestamos(resultado.prestamosActivos);
      },
      error: (err) => {
        console.error('Error al cargar cliente:', err);
        this.error.set('No se pudo cargar el cliente');
        this.cargando.set(false);
      }
    });
  }

  cargarEstadisticasPrestamos(prestamos: { id: string }[]): void {
    this.cargandoPrestamos.set(true);
    this.prestamoService.getPrestamosConDatosDesde(prestamos as any, this.cliente() ?? undefined).subscribe({
      next: (p) => {
        this.prestamos.set(p);
        this.cargandoPrestamos.set(false);
      },
      error: (err) => {
        console.error('Error al cargar préstamos:', err);
        this.cargandoPrestamos.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  verDetallePrestamo(prestamoId: string): void {
    this.router.navigate(['/prestamos', prestamoId]);
  }

  abrirPago(prestamo: PrestamoConCliente): void {
    this.modalPago()?.abrir(prestamo);
  }

  nuevoPrestamo(): void {
    const c = this.cliente();
    if (c) this.modalPrestamo()?.abrir(c);
  }

  onPrestamoRegistrado(): void {
    const id = this.cliente()?.id;
    if (id) this.cargarCliente(id);
  }

  onPagoRegistrado(): void {
    const id = this.cliente()?.id;
    if (id) this.cargarCliente(id);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {}

  compartirWhatsApp(): void {
    const c = this.cliente();
    if (!c) return;

    const zona = this.getNombreZona(c.zonaId);
    const prestamosActivos = this.prestamos().filter(
      p => p.estadisticas?.estado !== 'completado' &&
           p.estadisticas?.estado !== 'refinanciado' &&
           p.estadisticas?.estado !== 'cerrado_pronto_pago'
    );
    const saldoTotal = prestamosActivos.reduce((sum, p) => sum + (p.estadisticas?.totalPorCobrar || 0), 0);

    let texto = `👤 *Cliente: ${c.nombre}*\n`;
    if (c.alias) texto += `  Alias: "${c.alias}"\n`;
    texto += `  Cédula: ${c.identificacion}\n`;
    if (c.telefono) texto += `  📞 Tel: ${c.telefono}\n`;
    texto += `  📍 Zona: ${zona}\n`;
    if (c.direccion) texto += `  🏠 Dir: ${c.direccion}\n`;
    if (prestamosActivos.length > 0) {
      texto += `\n💰 *Préstamos activos: ${prestamosActivos.length}*\n`;
      texto += `  Saldo total: ${this.formatCurrency(saldoTotal)}\n`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  getNombreZona(zonaId: string): string {
    return this.zonas().find(z => z.id === zonaId)?.nombre || zonaId;
  }

  getTextoFrecuencia(frecuencia: FrecuenciaPago): string {
    const textos: Record<FrecuenciaPago, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual',
    };
    return textos[frecuencia] ?? frecuencia;
  }

  getProgressBarClass(porcentaje: number): string {
    if (porcentaje >= 100) return 'complete';
    if (porcentaje >= 50) return 'high';
    if (porcentaje >= 25) return 'medium';
    return 'low';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
