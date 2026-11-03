import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/** Hace una foto con la cámara (reducida a 1280 px en el plugin, fuera del hilo de la interfaz). */
@Injectable({ providedIn: 'root' })
export class CamaraService {
  /** Devuelve la foto, o null si el usuario cancela. */
  async hacerFoto(): Promise<{ blob: Blob; vista: string } | null> {
    try {
      const foto = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 80,
        width: 1280,
        height: 1280,
        correctOrientation: true,
      });
      if (!foto.webPath) {
        return null;
      }
      const blob = await (await fetch(foto.webPath)).blob();
      return { blob, vista: foto.webPath };
    } catch {
      return null;
    }
  }
}
