import type { OnDestroy } from '@angular/core';
import { Injectable, inject } from '@angular/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { Subject } from 'rxjs';

import { AvisosService } from './avisos.service';
import { PreferenciasService } from './preferencias.service';

/** Más de 2 g, y como mucho un refresco cada 1,5 s: los mismos valores que AgitarDetector en Android.
 *  Con 2,5 g había que agitar muy fuerte en un móvil real; andar o guardar el móvil no llega a 2 g. */
const GRAVEDAD = 9.81;
const UMBRAL_G = 2;
const PAUSA_MS = 1500;

export function esAgitacion(x: number, y: number, z: number): boolean {
  return Math.sqrt(x * x + y * y + z * z) / GRAVEDAD > UMBRAL_G;
}

/** «Agitar para refrescar» con el acelerómetro (rúbrica Móviles 5). Las listas se suscriben a agitado$. */
@Injectable({ providedIn: 'root' })
export class AgitarService implements OnDestroy {
  private readonly preferencias = inject(PreferenciasService);
  private readonly avisos = inject(AvisosService);
  private readonly aviso = new Subject<void>();
  private escucha?: PluginListenerHandle;
  private ultima = 0;

  readonly agitado$ = this.aviso.asObservable();

  async iniciar(): Promise<void> {
    if (this.escucha) {
      return;
    }
    this.escucha = await Motion.addListener('accel', (e) => {
      const a = e.accelerationIncludingGravity;
      const ahora = Date.now();
      if (this.preferencias.agitar() && esAgitacion(a.x, a.y, a.z) && ahora - this.ultima > PAUSA_MS) {
        this.ultima = ahora;
        this.aviso.next();
      }
    });
  }

  /** Lo llama la pantalla que se refresca: si los datos no cambian, el usuario sabe que ha funcionado (como el Snackbar de Android). */
  avisar(): void {
    void this.avisos.mensaje('Actualizando…');
  }

  ngOnDestroy(): void {
    void this.escucha?.remove();
  }
}
