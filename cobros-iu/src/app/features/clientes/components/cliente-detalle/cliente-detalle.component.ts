import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import type { IZona } from '../../../core/models';
import type { IClienteConPrestamosActivos } from '../../../core/models/cliente.model';
import { AbstractClienteService } from '../../../core/services/abstract-cliente.service';
import { AbstractZonaService } from '../../../core/services/abstract-zona.service';

/**
 * Vista de detalle de un cliente: muestra datos completos del cliente
 * con acceso rápido al historial de préstamos.
 */
@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-detalle.component.html',
  styleUrl: './cliente-detalle.component.scss',
})
export class ClienteDetalleComponent implements OnInit {
  cliente = signal<IClienteConPrestamosActivos | null>(null);
  zonas = signal<IZona[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private clienteService: AbstractClienteService,
    private zonaService: AbstractZonaService,
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
      },
      error: (err) => {
        console.error('Error al cargar cliente:', err);
        this.error.set('No se pudo cargar el cliente');
        this.cargando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  verPrestamos(): void {
    const c = this.cliente();
    if (!c) return;
    this.router.navigate(['/prestamos'], {
      queryParams: { cliente: c.id, returnTo: `/clientes/${c.id}` }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {}

  compartirWhatsApp(): void {
    const c = this.cliente();
    if (!c) return;

    const zona = this.getNombreZona(c.zonaId);

    let texto = `👤 *Cliente: ${c.nombre}*\n`;
    if (c.alias) texto += `  Alias: "${c.alias}"\n`;
    texto += `  Cédula: ${c.identificacion}\n`;
    if (c.telefono) texto += `  📞 Tel: ${c.telefono}\n`;
    texto += `  📍 Zona: ${zona}\n`;
    if (c.direccion) texto += `  🏠 Dir: ${c.direccion}\n`;

    const clave = c.id;
    if (clave) {
      texto += `\n🔗 Consultá tu saldo:\n${window.location.origin}/consulta/${clave}`;
    }

    const telefonoLimpio = c.telefono?.replace(/\D/g, '') ?? '';
    const telefonoConPrefijo = telefonoLimpio ? `57${telefonoLimpio}` : '';
    const url = telefonoConPrefijo
      ? `https://wa.me/${telefonoConPrefijo}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  getNombreZona(zonaId: string): string {
    return this.zonas().find(z => z.id === zonaId)?.nombre || zonaId;
  }
}
