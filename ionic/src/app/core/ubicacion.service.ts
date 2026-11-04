import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { Position } from '@capacitor/geolocation';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';

export interface Punto {
  latitud: number;
  longitud: number;
}

const CLAVE_AVISADO = 'ubicacionAvisada';
export type EstadoUbicacion = 'buscando' | 'obtenida' | 'sin_permiso';

/**
 * GPS con el plugin de Capacitor (en el navegador usa la API del propio navegador).
 * Guarda la última posición: el interceptor la manda en X-Latitud/X-Longitud (ADR-014).
 * El GPS va en segundo plano y las páginas leen el signal: no bloquea la interfaz.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly alertas = inject(AlertController);

  readonly punto = signal<Punto | null>(null);
  readonly estado = signal<EstadoUbicacion>('buscando');

  /** Primera vez: explica para qué se usa ANTES de que salga el permiso del sistema (DESIGN.md §10). */
  async pedirConAviso(): Promise<void> {
    if (localStorage.getItem(CLAVE_AVISADO)) {
      await this.actualizar();
      return;
    }
    const alerta = await this.alertas.create({
      header: '¿Nos dejas usar tu ubicación?',
      message:
        'La tienda registra desde dónde haces cada consulta, pedido o reparación. Sin ella no podrás confirmar pedidos ni pedir reparaciones.',
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        { text: 'Continuar', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    localStorage.setItem(CLAVE_AVISADO, '1');
    if (role === 'confirm') {
      await this.actualizar();
    } else {
      this.estado.set('sin_permiso');
    }
  }

  async actualizar(): Promise<void> {
    this.estado.set('buscando');
    try {
      // En la APK el plugin no pide el permiso solo; en el navegador lo pide el propio navegador
      if (Capacitor.isNativePlatform()) {
        const permiso = await Geolocation.requestPermissions();
        if (permiso.location !== 'granted' && permiso.coarseLocation !== 'granted') {
          this.estado.set('sin_permiso');
          return;
        }
      }
      const posicion = await this.posicion();
      this.punto.set({ latitud: posicion.coords.latitude, longitud: posicion.coords.longitude });
      this.estado.set('obtenida');
    } catch {
      // Sin permiso o sin señal: la API acepta la petición sin cabeceras, pero no los pedidos ni las reparaciones
      this.estado.set(this.punto() ? 'obtenida' : 'sin_permiso');
    }
  }

  /** Primero la ubicación aproximada, que gasta menos (CPU mínima); si no hay, el GPS. */
  private async posicion(): Promise<Position> {
    try {
      return await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    } catch {
      return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    }
  }
}
