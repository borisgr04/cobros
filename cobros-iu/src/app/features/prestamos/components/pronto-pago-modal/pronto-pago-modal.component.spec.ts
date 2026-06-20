import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProntoPagoModalComponent } from './pronto-pago-modal.component';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { PrestamoConCliente } from '../../services/prestamo.service';
import type { IProntoPagoResumen } from '../../../core/models';

const resumenMock: IProntoPagoResumen = {
  saldoPendiente: 500_000,
  cuotasPendientes: 5,
  interesesFuturosEstimados: 50_000,
  valorSugerido: 500_000,
};

const prestamoMock: PrestamoConCliente = {
  id: 'p1',
  clienteId: 'c1',
  valorPrestado: 1_000_000,
  interesProyectado: 100_000,
  valorTotal: 1_100_000,
  cantidadCuotas: 10,
  valorCuota: 110_000,
  frecuenciaPago: 'mensual',
  fechaPrestamo: new Date('2025-01-01'),
  fechaFinal: new Date('2025-12-01'),
  estado: 'activo',
  cliente: { id: 'c1', nombre: 'Test Cliente', telefono: '3001234567' } as any,
};

describe('ProntoPagoModalComponent', () => {
  let fixture: ComponentFixture<ProntoPagoModalComponent>;
  let component: ProntoPagoModalComponent;
  let prestamoServiceSpy: jasmine.SpyObj<AbstractPrestamoService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj<AbstractPrestamoService>('AbstractPrestamoService', [
      'getResumenProntoPago',
      'ejecutarProntoPago',
    ]);
    spy.getResumenProntoPago.and.returnValue(of(resumenMock));

    await TestBed.configureTestingModule({
      imports: [ProntoPagoModalComponent],
      providers: [{ provide: AbstractPrestamoService, useValue: spy }],
    }).compileComponents();

    prestamoServiceSpy = TestBed.inject(AbstractPrestamoService) as jasmine.SpyObj<AbstractPrestamoService>;
    fixture = TestBed.createComponent(ProntoPagoModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CTA del footer (paso resumen)', () => {
    beforeEach(fakeAsync(() => {
      component.abrir(prestamoMock);
      tick();
      fixture.detectChanges();
    }));

    it('debería mostrar "Aplicar Pronto Pago" como etiqueta del botón primario', () => {
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primary');
      expect(boton).toBeTruthy();
      expect(boton.textContent?.trim()).toContain('Aplicar Pronto Pago');
    });

    it('el botón primario debería estar deshabilitado cuando valorNegociado es 0', () => {
      component.valorNegociado.set(0);
      fixture.detectChanges();
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primary');
      expect(boton.disabled).toBeTrue();
    });

    it('el botón primario debería estar habilitado con un valor válido', () => {
      component.valorNegociado.set(500_000);
      fixture.detectChanges();
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primary');
      expect(boton.disabled).toBeFalse();
    });

    it('el botón primario debería estar deshabilitado mientras procesando() es true', () => {
      component.valorNegociado.set(500_000);
      component.procesando.set(true);
      fixture.detectChanges();
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primary');
      expect(boton.disabled).toBeTrue();
    });
  });
});
