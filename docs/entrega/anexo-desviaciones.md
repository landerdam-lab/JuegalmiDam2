# Anexo de cambios y desviaciones (E-08)

> **Borrador.** La propuesta del Hito 1 (`propuesta-hito1`) aún no está en el repo, así que estos cambios se han recogido comparando con el **enunciado** y las decisiones (ADR) de la bóveda. Cuando exista la propuesta, hay que revisar esta lista contra ella. Cada fila la tiene que confirmar el grupo.

| Fecha | Qué cambia | Por qué | Impacto |
|---|---|---|---|
| 2026-10-28 | Las plataformas pasan de «Android nativo + Windows Phone e iOS híbridas» a **dos apps Android**: nativa e Ionic compilada como APK (A-11, ADR-024) | Lo indicó el profesorado. Windows Phone está descontinuado e iOS necesita un Mac | No hay build de iOS ni de Windows Phone |
| 2026-10-28 | Las apps son **solo para clientes**. La gestión pasa a una **web en Angular** nueva, con parte pública (ADR-024) | Lo indicó el profesorado | Una pieza más que desarrollar. Ninguna APK tiene gestión |
| 2026-10-28 | El catálogo y la tienda de la **web** son públicos, sin token; las apps, todo con token (ADR-028) | Confirmado por el profesor | Excepción a «todo con token» solo en esos `GET` |
| 2026-10-28 | Sin `AsyncTask`, que está obsoleta: se usan Executors, Volley y Retrofit (A-12) | Android la retiró | Se justifica en la defensa |
| 2026-10-28 | «Factory» en Ionic se implementa como servicios `@Injectable` de Angular (A-15) | «Factory» es un concepto de AngularJS | Se explica en el dossier |
| 2026-10-28 | Solo se alquilan videojuegos, y el admin no compra ni alquila (ADR-029) | Decisión del grupo | Para comprar, el admin usa otra cuenta |
| 2026-10-28 | Los técnicos son `trabajador` y entran en la **web**, donde ven solo las reparaciones de su departamento (ADR-032) | Decisión del grupo | Sin pantallas de técnico en las apps |
| 2026-10-30 | Marca **Almi Companion** en apps y web; el cliente sigue siendo JuegAlmi (ADR-036) | Decisión del grupo | Hay que aclararlo en la presentación (A-35) |
| 2026-10-30 | Además de recoger en tienda, **envío gratis a domicilio** con mapa (ADR-038) | Pedido por Lander | Cuatro columnas nuevas en `pedido` |
| 2026-10-29 | Las copias de seguridad van a **S3** con un temporizador en AWS, no en `api/backups/` | Decisión de infraestructura | Ver `docs/infraestructura/copias-de-seguridad.md` |
