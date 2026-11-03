import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

import { AvisosService } from './avisos.service';
import type { OrdenVoz } from './orden-voz';
import { interpretar } from './orden-voz';

/** Control por voz de varias partes de la app (PT-29, rúbrica Móviles 5). */
@Injectable({ providedIn: 'root' })
export class VozService {
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);

  async escuchar(): Promise<void> {
    const frase = await this.reconocer();
    if (frase) {
      this.ejecutar(interpretar(frase));
      void this.avisos.mensaje(`He entendido: «${frase}»`);
    }
  }

  private async reconocer(): Promise<string | null> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return await this.reconocerEnNavegador();
      }
      const { available } = await SpeechRecognition.available();
      if (!available) {
        void this.avisos.mensaje('Este móvil no tiene reconocimiento de voz');
        return null;
      }
      const permiso = await SpeechRecognition.requestPermissions();
      if (permiso.speechRecognition !== 'granted') {
        return null;
      }
      // popup: el diálogo de voz de Android, con la pista de lo que se puede decir
      const r = await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 1,
        partialResults: false,
        popup: true,
        prompt: 'Di por ejemplo «abre el carrito», «mis pedidos», «llévame a la tienda» o «busca Zelda»',
      });
      return r.matches?.[0] ?? null;
    } catch {
      return null;
    }
  }

  /** Solo para `ionic serve`: el plugin no funciona en el navegador. */
  private reconocerEnNavegador(): Promise<string | null> {
    const w = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Reconocedor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Reconocedor) {
      void this.avisos.mensaje('Este navegador no tiene reconocimiento de voz');
      return Promise.resolve(null);
    }
    return new Promise((resolver) => {
      const r = new Reconocedor();
      r.lang = 'es-ES';
      r.onresult = (e: any) => resolver(e.results[0][0].transcript);
      r.onerror = () => resolver(null);
      r.start();
    });
  }

  private ejecutar(orden: OrdenVoz): void {
    const rutas: Partial<Record<OrdenVoz['accion'], string>> = {
      carrito: '/carrito',
      pedidos: '/pedidos',
      alquileres: '/alquileres',
      reparaciones: '/reparaciones',
      nueva_reparacion: '/reparaciones/nueva',
      perfil: '/perfil',
      tienda: '/tienda',
      servicios: '/tienda/servicios',
      ubicacion: '/tienda/ubicacion',
      galeria: '/tienda/galeria',
      historia: '/tienda/historia',
    };
    const ruta = rutas[orden.accion];
    if (ruta) {
      void this.router.navigateByUrl(ruta);
      return;
    }
    const pestanas: Partial<Record<OrdenVoz['accion'], string>> = { inicio: 'videojuego', videojuegos: 'videojuego', moviles: 'movil', consolas: 'consola' };
    const params = orden.accion === 'buscar' ? { q: orden.texto } : { pestana: pestanas[orden.accion] };
    void this.router.navigate(['/inicio'], { queryParams: params });
  }
}
