import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { AmpliacionPlazoModalComponent } from './ampliar-plazo-modal.component';
import { AbstractPrestamoService } from '../../../core/services/abstract-prestamo.service';
import type { PrestamoConCliente } from '../../services/prestamo.service';
import type { IAmpliacionPlazoResumen } from '../../../core/models';

const resumenMock: IAmpliacionPlazoResumen = {
  saldoPendiente: 300_000,
  cuotasPendientes: 3,
  fechaFinalActual: new Date('2025-09-01'),
  frecuenciaPago: 'quincenal',
};

const prestamoMock: PrestamoConCliente = {
  id: 'p1',
  clienteId: 'c1',
  valorPrestado: 600_000,
  interesProyectado: 60_000,
  valorTotal: 660_000,
  cantidadCuotas: 6,
  valorCuota: 110_000,
  frecuenciaPago: 'quincenal',
  fechaPrestamo: new Date('2025-01-01'),
  fechaFinal: new Date('2025-09-01'),
  estado: 'activo',
  cliente: { id: 'c1', nombre: 'Test Ampliar', telefono: '3009876543' } as any,
};

describe('AmpliacionPlazoModalComponent', () => {
  let fixture: ComponentFixture<AmpliacionPlazoModalComponent>;
  let component: AmpliacionPlazoModalComponent;
  let prestamoServiceSpy: jasmine.SpyObj<AbstractPrestamoService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj<AbstractPrestamoService>('AbstractPrestamoService', [
      'getResumenAmpliacion',
      'ejecutarAmpliacion',
    ]);
    spy.getResumenAmpliacion.and.returnValue(of(resumenMock));

    await TestBed.configureTestingModule({
      imports: [AmpliacionPlazoModalComponent],
      providers: [{ provide: AbstractPrestamoService, useValue: spy }],
    }).compileComponents();

    prestamoServiceSpy = TestBed.inject(AbstractPrestamoService) as jasmine.SpyObj<AbstractPrestamoService>;
    fixture = TestBed.createComponent(AmpliacionPlazoModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CTA del footer (paso formulario)', () => {
    beforeEach(fakeAsync(() => {
      component.abrir(prestamoMock);
      tick();
      fixture.detectChanges();
    }));

    it('debería mostrar "Ampliar Plazo" como etiqueta del botón primario', () => {
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primary');
      expect(boton).toBeTruthy();
      expect(boton.textContent?.trim()).toContain('Ampliar Plazo');
    });

    it('el botón primario debería estar deshabilitado mientras procesando() es true', () => {
      component.procesando.set(true);
      fixture.detectChanges();
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-primary');
      expect(boton.disabled).toBeTrue();
    });
  });

  describe('Fecha inicio — editabilidad', () => {
    beforeEach(fakeAsync(() => {
      component.abrir(prestamoMock);
      tick();
      fixture.detectChanges();
    }));

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

  describe('Frecuencia heredada del préstamo al abrir', () => {
    it('debería inicializar frecuenciaNueva con el valor del préstamo (quincenal)', fakeAsync(() => {
      component.abrir(prestamoMock);
      tick();
      expect(component.frecuenciaNueva()).toBe('quincenal');
    }));
  });
});
