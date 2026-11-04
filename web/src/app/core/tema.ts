import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';

export type Tema = 'sistema' | 'claro' | 'oscuro';

const CLAVE = 'almi-tema';

/**
 * Modo claro / oscuro. La paleta oscura del sistema «Cartucho» se activa con la clase
 * .ion-palette-dark en <html> (la misma que usa la app de Ionic: así se reutiliza su tema tal cual).
 * La preferencia se guarda en localStorage; "sistema" sigue a prefers-color-scheme.
 */
@Service()
export class Temas {
  private readonly documento = inject(DOCUMENT);
  private readonly consulta = this.documento.defaultView?.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  private readonly sistemaOscuro = signal(this.consulta?.matches ?? false);

  readonly tema = signal<Tema>(this.leer());
  readonly esOscuro = computed(
    () => this.tema() === 'oscuro' || (this.tema() === 'sistema' && this.sistemaOscuro()),
  );

  constructor() {
    this.consulta?.addEventListener('change', (e) => this.sistemaOscuro.set(e.matches));
    effect(() =>
      this.documento.documentElement.classList.toggle('ion-palette-dark', this.esOscuro()),
    );
  }

  /** El botón de la barra alterna entre claro y oscuro (y deja de seguir al sistema). */
  alternar(): void {
    const nuevo: Tema = this.esOscuro() ? 'claro' : 'oscuro';
    this.tema.set(nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // Sin almacenamiento: el cambio dura hasta recargar
    }
  }

  private leer(): Tema {
    try {
      const t = localStorage.getItem(CLAVE);
      return t === 'claro' || t === 'oscuro' ? t : 'sistema';
    } catch {
      return 'sistema';
    }
  }
}
