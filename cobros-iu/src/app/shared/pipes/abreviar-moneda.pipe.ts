import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'abreviarMoneda', standalone: true })
export class AbreviarMonedaPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '$0';
    if (value >= 1000) {
      const miles = Math.round(value / 1000);
      return `$${new Intl.NumberFormat('es-CO').format(miles)}k`;
    }
    return `$${Math.round(value)}`;
  }
}
