import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const isAuthenticated = signal(false);
  const currentUser = signal<{ email: string } | null>(null);
  let ensureValidSessionResult = false;

  const routerMock = {
    createUrlTree: (_commands: string[], extras?: { queryParams?: Record<string, string> }) =>
      ({ queryParams: extras?.queryParams ?? null }) as unknown as UrlTree
  };

  const authServiceMock = {
    isAuthenticated: isAuthenticated.asReadonly(),
    currentUser: currentUser.asReadonly(),
    ensureValidSession: jasmine.createSpy('ensureValidSession').and.callFake(async () => ensureValidSessionResult)
  };

  beforeEach(() => {
    isAuthenticated.set(false);
    currentUser.set(null);
    ensureValidSessionResult = false;
    authServiceMock.ensureValidSession.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
  });

  it('allows navigation when the session is valid', async () => {
    ensureValidSessionResult = true;

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(authServiceMock.ensureValidSession).toHaveBeenCalled();
  });

  it('redirects with an expiration reason when there was a previous session', async () => {
    currentUser.set({ email: 'dev@test.com' });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toEqual({ queryParams: { reason: 'session-expired' } } as unknown as UrlTree);
  });

  it('redirects to login without expiration reason when there was no previous session', async () => {
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toEqual({ queryParams: null } as unknown as UrlTree);
  });
});
