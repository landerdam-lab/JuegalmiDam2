import { Injectable, signal } from '@angular/core';

export type Tema = 'sistema' | 'claro' | 'oscuro';

/** Preferencias de la app (PT-21), en Local Storage: tema visual y «agitar para refrescar». */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  readonly tema = signal<Tema>((localStorage.getItem('tema') as Tema | null) ?? 'sistema');
  readonly agitar = signal<boolean>(localStorage.getItem('agitar') !== '0');

  private readonly sistema = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.aplicarTema();
    this.sistema.addEventListener('change', () => this.aplicarTema());
  }

  cambiarTema(tema: Tema): void {
    this.tema.set(tema);
    localStorage.setItem('tema', tema);
    this.aplicarTema();
  }

  cambiarAgitar(activo: boolean): void {
    this.agitar.set(activo);
    localStorage.setItem('agitar', activo ? '1' : '0');
  }

  private aplicarTema(): void {
    const oscuro = this.tema() === 'oscuro' || (this.tema() === 'sistema' && this.sistema.matches);
    // ion-palette-dark es la clase que usan el tema de Ionic y variables.scss
    document.documentElement.classList.toggle('ion-palette-dark', oscuro);
  }
}
