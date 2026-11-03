import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

/** Toasts (el «Snackbar» de Android) y diálogos de confirmación, iguales en toda la app. */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly toasts = inject(ToastController);
  private readonly alertas = inject(AlertController);

  async mensaje(texto: string, accion?: { texto: string; hacer: () => void }): Promise<void> {
    const toast = await this.toasts.create({
      message: texto,
      duration: accion ? 4000 : 2500,
      position: 'bottom',
      buttons: accion ? [{ text: accion.texto, handler: accion.hacer }] : [],
    });
    await toast.present();
  }

  /** Cancelar, cerrar sesión…: el botón que confirma va en rojo (DESIGN.md §9). */
  async confirmarDestructivo(titulo: string, texto: string, boton: string): Promise<boolean> {
    const alerta = await this.alertas.create({
      header: titulo,
      message: texto,
      cssClass: 'ja-dialogo-destructivo',
      buttons: [
        { text: 'Volver', role: 'cancel' },
        { text: boton, role: 'destructive' },
      ],
    });
    await alerta.present();
    return (await alerta.onDidDismiss()).role === 'destructive';
  }

  async informar(titulo: string, texto: string): Promise<void> {
    const alerta = await this.alertas.create({ header: titulo, message: texto, buttons: ['Cerrar'] });
    await alerta.present();
    await alerta.onDidDismiss();
  }
}
