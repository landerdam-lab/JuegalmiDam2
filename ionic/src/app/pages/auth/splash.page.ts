import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import { SesionService } from '../../core/sesion.service';
import { Logo } from '../../shared/logo.component';
import { Vida } from '../../shared/vida.component';

/** PT-01 Splash: logo y barra de vida mientras comprueba el token. Con sesión válida → Inicio; si no → Login. */
@Component({
  imports: [IonContent, Logo, Vida],
  styles: `
    .caja {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ja-espacio-6);
      padding: var(--ja-espacio-8);
    }
    ja-vida {
      width: 100%;
      max-width: 240px;
    }
  `,
  template: `
    <ion-content>
      <div class="caja">
        <ja-logo class="grande" />
        <ja-vida [llenos]="progreso()" [total]="5" />
      </div>
    </ion-content>
  `,
})
export class SplashPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  readonly progreso = signal(1);

  ngOnInit(): void {
    const temporizador = setInterval(() => this.progreso.update((n) => Math.min(n + 1, 5)), 180);
    const ir = (ruta: string) => {
      clearInterval(temporizador);
      void this.router.navigateByUrl(ruta, { replaceUrl: true });
    };
    if (!this.sesion.haySesion()) {
      setTimeout(() => ir('/login'), 700);
      return;
    }
    // Sin red también se entra (el token aún no ha caducado); un 401 ya lo lleva al login el interceptor
    this.auth.comprobarSesion().subscribe({
      next: () => ir('/inicio'),
      error: (e) => {
        if (e.status !== 401) {
          ir('/inicio');
        }
      },
    });
  }
}
