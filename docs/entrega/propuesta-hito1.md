# Propuesta de diseño: Hito 1 (E-01)

> **BORRADOR para revisar en grupo.** Lo ha redactado Claude Code a partir de las decisiones (ADR) y de los requisitos de la bóveda. Hay que revisarlo, completar lo marcado con **[GRUPO]** y poder defenderlo antes de entregarlo.
>
> **Equipo:** Lander, Oier y Ruben · DAM2 · ALMI · curso 25-26

## 1. La empresa y su problema

JuegAlmi es una tienda ficticia que vende y alquila videojuegos, vende y repara consolas, y vende y repara móviles y tablets. Necesita que sus clientes puedan comprar, alquilar y pedir reparaciones desde el móvil, y gestionar todo ello desde un único sitio. El enunciado exige además geolocalizar al usuario, datos de ejemplo precargados y una carga rápida y asíncrona.

**[GRUPO]** Comprobar esta descripción con el enunciado (`docs/reto/enunciado-retoJuegAlmi.pdf`).

## 2. Objetivos y alcance

**Qué entregamos:** una demo con una marca común, Almi Companion, formada por cuatro piezas en un solo repositorio.

| Pieza | Para quién | Qué hace |
|---|---|---|
| API REST (Symfony y MariaDB) | Las otras tres piezas | Reglas de negocio y datos, con tokens y HTTPS |
| App Android nativa (Java) | Clientes | Comprar, alquilar, pedir reparaciones, perfil y sección «La tienda» |
| App híbrida (Ionic, compilada como APK) | Clientes | Lo mismo que la nativa, con el mismo diseño |
| Web (Angular) | Público, admin y técnicos | Publicidad, catálogo y toda la gestión |

**Fuera de alcance:**
- El juego propio de la tienda, que el enunciado menciona como posible encargo futuro.
- Una pasarela de pago real: el método de pago se guarda, pero no se cobra.
- Gestión administrativa en las apps: va en la web, por indicación del profesorado (ADR-024).

## 3. Alternativas estudiadas

Solo se recogen las alternativas que constan en las decisiones del proyecto.

| Decisión | Elegida | Descartada | Por qué |
|---|---|---|---|
| Lenguaje en Android | Java y XML | Kotlin y Jetpack Compose | Son más modernos, pero se alejan del enunciado y de la rúbrica |
| Versión de Symfony | 7.4 con PHP 8.3 | Symfony 8 | Necesita PHP 8.4 |
| Base de datos | MariaDB 11.4 | MySQL 8.4 | Compatible con MySQL y ya probada en la infraestructura; **[GRUPO]** falta confirmar con el profesor (P-33) |
| | | MariaDB de XAMPP | Suele ser una versión antigua, distinta de la del servidor |
| Dónde desplegar | AWS con host bastión | Azure, GCP, Railway o un VPS | No aportan nada frente a AWS Academy, disponible en el centro y sin tarjeta |
| | | RDS para la BBDD | Más sencillo de mantener, pero la infraestructura ya funciona con MariaDB en Docker |
| Imágenes | Archivos, con la ruta en la BBDD | Base64 en la BBDD | Respuestas pesadas, más CPU y memoria, y sin caché |
| Mapas | OpenStreetMap (OSMDroid y Leaflet) | Google Maps | Necesita clave de API con facturación |
| Interfaz de la web | Angular con el tema propio | Ionic también en la web | Cargaría componentes móviles en un backoffice de escritorio |
| | | Angular Material o PrimeNG | Un segundo sistema de diseño que choca con el nuestro |
| Buscar direcciones | Nominatim, a través de la API | Desde cada app | Dos implementaciones, y el servicio vería la IP de cada móvil |

**[GRUPO]** El índice de la bóveda pide también comparar **Volley y Retrofit**, **Ionic frente a Flutter o React Native** y **Angular frente a React**. No consta ningún debate escrito: añadid aquí lo que hablasteis, sin inventarlo. Volley y Retrofit se usan los dos en la app nativa: Volley para leer y Retrofit para escribir.

## 4. Arquitectura

```
Apps (Android e Ionic)  ─┐
                         ├─ HTTPS ─▶ Proxy en el bastión ─▶ API Symfony ─▶ MariaDB
Web (Angular)           ─┘            (subred pública)       (subred privada)
```

- **La API es el contrato:** ni las apps ni la web acceden a la base de datos, y la lógica de negocio (stock, copias, precios y permisos) vive en la API.
- **Todo con token**, salvo el login, el registro y las lecturas públicas de catálogo y tienda para la web (ADR-028).
- **Ubicación:** las apps la envían en cada petición, y la API la guarda en `registro_ubicacion` (ADR-014).
- **En AWS:** el bastión es la única entrada SSH, y la API y la BBDD no tienen IP pública (ADR-010).

## 5. Modelo de datos

Modelo v6, con 19 tablas y sin redundancia (ADR-023, ADR-032 y ADR-034):
- **Herencia:** `producto` → `videojuego`, `movil`, `consola` · `usuario` → `cliente`, `trabajador`.
- **Pedido:** tiene `compra` (N:M con `producto`) y `alquiler` (N:M con `videojuego`).
- **Reglas en la BBDD:** además de la validación de la API, hay restricciones CHECK y 10 triggers.

**Diagramas:** `docs/datos/er-juegalmi.png` y `docs/datos/relacional-juegalmi.png` · paso a tablas: `docs/datos/paso-a-tablas.md`.

**[GRUPO]** Comprobar que los diagramas exportados están al día: al añadir la entrega a domicilio (ADR-038) quedó pendiente regenerar el PNG y el SVG.

## 6. Funcionalidades por rol

| Rol | Dónde | Qué puede hacer |
|---|---|---|
| Visitante | Web pública | Ver la publicidad, el catálogo y la tienda |
| Cliente | Apps | Comprar, alquilar, entrega en tienda o a domicilio, pedir reparaciones con foto, perfil y «La tienda» |
| Técnico | Backoffice | Solo las reparaciones de su departamento: estado y presupuesto |
| Admin | Backoffice | Toda la gestión: productos, clientes, trabajadores, pedidos, alquileres, reparaciones y tienda |

**Además, en las apps:** cámara, GPS, control por voz y agitar para refrescar. El admin no compra ni alquila, y solo se alquilan videojuegos (ADR-029).

## 7. Diseño

Sistema «Cartucho» (ADR-022), común a las tres interfaces, con una sola fuente de colores, tipografías y espaciados (`design/tokens.json`). Su firma visual es la muesca en la esquina de las tarjetas y la barra de vida para el progreso.

- **Guía:** `design/DESIGN.md`.
- **Pantallas:** `design/screens/` y `design/SCREEN-MAP.md`.

## 8. API

Lista completa de rutas en la bóveda (`05-API/Endpoints.md`) y guía en `api/README.md`. Los recursos principales son: autenticación y perfil, catálogo, pedidos, alquileres, reparaciones, tienda, usuarios, trabajadores, registro de ubicaciones, imágenes y direcciones.

## 9. Planificación y reparto

| Semana | Fases |
|---|---|
| 1 | 1, 2, 3, 4 y 5 |
| 2 a 4 | 4 y 5 |
| **5** | **4, 5, 6 y 7 · Hito 1** |
| 6 a 8 | 4 y 5 |
| 9 y 10 | 8 y 9 |
| **11** | **8, 9, 10 y 11 · Hito 2: entrega y presentación** |

**Reparto real hasta ahora, según la bóveda:**
- **Lander:** infraestructura, modelo de datos, API, app nativa y app Ionic.
- **Oier:** modelo de datos, API, sistema de diseño, app nativa y web.
- **Ruben:** **[GRUPO]** completar. Consta como autor del borrador del dossier.

## 10. Riesgos

| Riesgo | Cómo se afronta |
|---|---|
| El laboratorio de AWS Academy se apaga con la sesión | Encenderlo antes de la demo; tener un vídeo de respaldo (E-11) |
| Sin Internet, falla la búsqueda de direcciones y los mapas | Marcar la dirección tocando el mapa; llevar el vídeo de respaldo |
| Sin probar aún en móvil real | Probar las dos APK antes de la demo |
| La bóveda solo existe en un PC (A-43) | **[GRUPO]** decidir dónde copiarla |
| Las fotos de productos tienen derechos de terceros (A-50) | Válidas para una demo académica; revisar si se publicara |
| Mucho código generado con IA | Que el grupo lo revise y pueda defenderlo |

## Nota para el grupo

La propuesta se redacta cuando el proyecto ya está muy avanzado. Por eso el anexo de desviaciones (`docs/entrega/anexo-desviaciones.md`) debe revisarse junto con este documento. **[GRUPO]** Decidid si esto se presenta como propuesta inicial o se explica la situación al profesorado: conviene ser transparentes.
