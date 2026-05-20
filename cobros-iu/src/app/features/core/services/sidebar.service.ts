import { Injectable, signal, effect } from '@angular/core';

export type SidebarState = 'expanded' | 'collapsed';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Estado del sidebar (expandido/colapsado)
  private readonly sidebarState = signal<SidebarState>(this.getInitialState());

  constructor() {
    // Sincronizar cambios con localStorage
    effect(() => {
      const state = this.sidebarState();
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarState', state);
      }
    });
  }

  /**
   * Obtiene el estado inicial del sidebar basado en:
   * 1. localStorage (si existe)
   * 2. Ancho de pantalla (desktop = expanded, tablet = collapsed)
   */
  private getInitialState(): SidebarState {
    if (typeof window === 'undefined') {
      return 'expanded';
    }

    // Intentar obtener de localStorage
    const savedState = localStorage.getItem('sidebarState') as SidebarState;
    if (savedState) {
      return savedState;
    }

    // Determinar por ancho de pantalla
    const width = window.innerWidth;
    return width >= 1025 ? 'expanded' : 'collapsed';
  }

  /**
   * Obtiene el estado actual del sidebar
   */
  getState() {
    return this.sidebarState.asReadonly();
  }

  /**
   * Alterna el estado del sidebar (expanded <-> collapsed)
   */
  toggle(): void {
    const currentState = this.sidebarState();
    this.sidebarState.set(currentState === 'expanded' ? 'collapsed' : 'expanded');
  }

  /**
   * Establece el estado del sidebar
   */
  setState(state: SidebarState): void {
    this.sidebarState.set(state);
  }

  /**
   * Verifica si el sidebar está expandido
   */
  isExpanded(): boolean {
    return this.sidebarState() === 'expanded';
  }

  /**
   * Verifica si el sidebar está colapsado
   */
  isCollapsed(): boolean {
    return this.sidebarState() === 'collapsed';
  }
}
