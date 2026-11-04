import { Service, signal } from '@angular/core';

export interface Aviso {
  id: number;
  texto: string;
  tipo: 'exito' | 'error' | 'info';
}

/**
 * Avisos breves (toast) en la esquina: «Producto guardado», «No se ha podido borrar…».
 * Cualquier pantalla los lanza; el componente <ja-avisos> de la raíz los pinta.
 */
@Service()
export class Avisos {
  private siguiente = 1;
  readonly lista = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.mostrar(texto, 'exito');
  }

  error(texto: string): void {
    this.mostrar(texto, 'error', 7000);
  }

  info(texto: string): void {
    this.mostrar(texto, 'info');
  }

  cerrar(id: number): void {
    this.lista.update((l) => l.filter((a) => a.id !== id));
  }

  private mostrar(texto: string, tipo: Aviso['tipo'], duracion = 4500): void {
    const id = this.siguiente++;
    // Como mucho 3 a la vez: el más antiguo se va
    this.lista.update((l) => [...l.slice(-2), { id, texto, tipo }]);
    setTimeout(() => this.cerrar(id), duracion);
  }
}
