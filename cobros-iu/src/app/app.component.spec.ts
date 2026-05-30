import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './features/auth/services/auth.service';
import { SidebarService, SidebarState } from './features/core/services/sidebar.service';

describe('AppComponent', () => {
  const routerEvents = new Subject<NavigationEnd>();
  const hasActiveSession = signal(true);
  const sidebarState = signal<SidebarState>('expanded');
  const routerMock = {
    events: routerEvents.asObservable(),
    url: '/dashboard'
  };
  const sidebarServiceMock = {
    getState: () => sidebarState.asReadonly()
  };
  const authServiceMock = {
    hasActiveSession: hasActiveSession.asReadonly()
  };

  beforeEach(async () => {
    routerMock.url = '/dashboard';
    hasActiveSession.set(true);
    sidebarState.set('expanded');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: SidebarService, useValue: sidebarServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    })
      .overrideComponent(AppComponent, {
        set: {
          template: '<main></main>',
          imports: []
        }
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'cobros-app' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('cobros-app');
  });

  it('should show navigation on private routes with an active session', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.showNav()).toBeTrue();
  });

  it('should hide navigation on public routes even with an active session', () => {
    routerMock.url = '/consulta/abc';
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.showNav()).toBeFalse();
  });

  it('should hide navigation when there is no active session', () => {
    hasActiveSession.set(false);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.showNav()).toBeFalse();
  });
});
