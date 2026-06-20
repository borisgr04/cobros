import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecogerPrestamoModalComponent } from './recoger-prestamo-modal.component';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import { RouterModule } from '@angular/router';
import type { PrestamoConCliente } from '../../services/prestamo.service';

const prestamoSemanal: PrestamoConCliente = {
  id: 'p1',
  clienteId: 'c1',
  valorPrestado: 500_000,
  interesProyectado: 50_000,
  valorTotal: 550_000,
  cantidadCuotas: 11,
  valorCuota: 50_000,
  frecuenciaPago: 'semanal',
  fechaPrestamo: new Date('2025-01-01'),
  fechaFinal: new Date('2025-04-01'),
  estado: 'activo',
  cliente: { id: 'c1', nombre: 'Test', telefono: '3001234567' } as any,
};

const prestamoMensual: PrestamoConCliente = {
  ...prestamoSemanal,
  frecuenciaPago: 'mensual',
};

const prestamoDiario: PrestamoConCliente = {
  ...prestamoSemanal,
  frecuenciaPago: 'diario',
};

describe('RecogerPrestamoModalComponent', () => {
  let fixture: ComponentFixture<RecogerPrestamoModalComponent>;
  let component: RecogerPrestamoModalComponent;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj<AbstractPrestamoService>('AbstractPrestamoService', [
      'recogerPrestamo',
    ]);

    await TestBed.configureTestingModule({
      imports: [RecogerPrestamoModalComponent, RouterModule.forRoot([])],
      providers: [{ provide: AbstractPrestamoService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecogerPrestamoModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CTA del footer (paso formulario)', () => {
    beforeEach(() => {
      component.abrir(prestamoSemanal, 250_000);
      fixture.detectChanges();
    });

    it('debería mostrar "Recoger Préstamo" como etiqueta del botón primario', () => {
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primario');
      expect(boton).toBeTruthy();
      expect(boton.textContent?.trim()).toContain('Recoger Préstamo');
    });

    it('el botón primario debería estar deshabilitado mientras procesando() es true', () => {
      component.procesando.set(true);
      fixture.detectChanges();
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primario');
      expect(boton.disabled).toBeTrue();
    });
  });

  describe('Fecha inicio — editabilidad', () => {
    beforeEach(() => {
      component.abrir(prestamoSemanal, 250_000);
      fixture.detectChanges();
    });

    it('el input de fecha NO debería estar deshabilitado cuando procesando() es false', () => {
      component.procesando.set(false);
      fixture.detectChanges();
      const inputFecha: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
      expect(inputFecha).toBeTruthy();
      expect(inputFecha.disabled).toBeFalse();
    });

    it('el input de fecha debería estar deshabilitado mientras procesando() es true', () => {
      component.procesando.set(true);
      fixture.detectChanges();
      const inputFecha: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
      expect(inputFecha).toBeTruthy();
      expect(inputFecha.disabled).toBeTrue();
    });
  });

  describe('Frecuencia por defecto heredada del préstamo', () => {
    it('debería inicializar frecuenciaPago con el valor del préstamo (semanal)', () => {
      component.abrir(prestamoSemanal, 250_000);
      expect(component.frecuenciaPago()).toBe('semanal');
    });

    it('debería inicializar frecuenciaPago con mensual cuando el préstamo lo indica', () => {
      component.abrir(prestamoMensual, 250_000);
      expect(component.frecuenciaPago()).toBe('mensual');
    });

    it('debería inicializar frecuenciaPago con diario cuando el préstamo lo indica', () => {
      component.abrir(prestamoDiario, 250_000);
      expect(component.frecuenciaPago()).toBe('diario');
    });
  });

  describe('Proyección de cuotas ceil(totalACobrar / valorCuota)', () => {
    beforeEach(() => {
      component.abrir(prestamoSemanal, 250_000);
    });

    it('debería calcular cantidadCuotas = ceil(totalACobrar / valorCuota)', () => {
      // Capital: 250_000 (saldo) + 100_000 (adicional) = 350_000
      // Intereses: 50_000
      // Total: 400_000 / valor cuota 60_000 = 6.67 → ceil → 7
      component.dineroAdicional.set(100_000);
      component.intereses.set(50_000);
      component.valorCuota.set(60_000);
      expect(component.cantidadCuotas()).toBe(7);
    });

    it('debería calcular el valor de la última cuota correctamente cuando hay descuadre', () => {
      component.dineroAdicional.set(100_000);
      component.intereses.set(50_000);
      component.valorCuota.set(60_000);
      // 7 cuotas * 60_000 = 420_000; última cuota = 400_000 - 6 * 60_000 = 40_000
      expect(component.valorUltimaCuota()).toBe(40_000);
    });

    it('descuadreExacto debería ser true cuando la última cuota difiere', () => {
      component.dineroAdicional.set(100_000);
      component.intereses.set(50_000);
      component.valorCuota.set(60_000);
      expect(component.descuadreExacto()).toBeTrue();
    });

    it('descuadreExacto debería ser false cuando el total es divisible exactamente', () => {
      // 250_000 saldo + 50_000 adicional + 0 intereses = 300_000; cuota = 50_000 → 6 cuotas exactas
      component.dineroAdicional.set(50_000);
      component.intereses.set(0);
      component.valorCuota.set(50_000);
      expect(component.descuadreExacto()).toBeFalse();
    });
  });
});
