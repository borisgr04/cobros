import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ResumenZona } from '../models/dashboard.models';

interface ZonaDto { id: string; nombre: string; estado: string; }
interface ClienteDto { id: string; zonaId: string; }
interface PrestamoDto { id: string; clienteId: string; valorTotal: number; estadisticas?: { totalPorCobrar?: number; } }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  async getResumenPorZona(): Promise<ResumenZona[]> {
    const [zonas, clientes, prestamos] = await Promise.all([
      firstValueFrom(this.http.get<ZonaDto[]>(`${this.base}/api/zonas`)),
      firstValueFrom(this.http.get<ClienteDto[]>(`${this.base}/api/clientes`)),
      firstValueFrom(this.http.get<PrestamoDto[]>(`${this.base}/api/prestamos`)),
    ]);

    return zonas.map(zona => {
      const clientesZona = clientes.filter(c => c.zonaId === zona.id);
      const idsClientes = new Set(clientesZona.map(c => c.id));
      const prestamosZona = prestamos.filter(p => idsClientes.has(p.clienteId));
      const cartera = prestamosZona.reduce(
        (sum, p) => sum + (p.estadisticas?.totalPorCobrar ?? p.valorTotal ?? 0), 0
      );
      const pct = clientesZona.length > 0
        ? prestamosZona.length / clientesZona.length
        : 0;
      const estado: ResumenZona['estado'] =
        pct >= 0.8 ? 'excelente' :
        pct >= 0.5 ? 'bueno' :
        pct >= 0.2 ? 'regular' : 'critico';

      return {
        zonaId: zona.id,
        zona: zona.nombre,
        clientes: clientesZona.length,
        prestamos: prestamosZona.length,
        cartera,
        estado,
      };
    });
  }
}
