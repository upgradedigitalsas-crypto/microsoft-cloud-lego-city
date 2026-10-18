# CONTEXTO DEL PROYECTO: CLOUDCITY (MICROSOFT CLOUD LEGO DIGITAL TWIN)

> **Documento de Contexto para Agentes de IA (Codex / OpenAI / GitHub Copilot)**  
> **Proyecto:** `microsoft-cloud-lego-city`  
> **Repositorio:** [https://github.com/upgradedigitalsas-crypto/microsoft-cloud-lego-city](https://github.com/upgradedigitalsas-crypto/microsoft-cloud-lego-city)  
> **Despliegue en Vivo:** [https://upgradedigitalsas-crypto.github.io/microsoft-cloud-lego-city/](https://upgradedigitalsas-crypto.github.io/microsoft-cloud-lego-city/)  
> **Fecha de Actualización:** 2026-10-15  
> **Autor / Propietario:** Pablo Palacios (`upgradedigitalsas@gmail.com`)

---

## 1. Visión y Propósito del Proyecto

**CloudCity** es una aplicación web interactiva que representa la **Arquitectura Estratégica del Portafolio Microsoft Cloud y su Modelo As-a-Service** como un **gemelo digital (Digital Twin) en formato de ciudad LEGO 3D isométrica**, con simulación logística en tiempo real inspirada en dashboards de centros de distribución de alta gama (estilo *WareTrack*).

Transforma conceptos técnicos y comerciales complejos (IaaS, PaaS, SaaS, EA, MCA-E, CSP, MACC, True-up, Bundling E3/E5) en una experiencia visual, pedagógica y comercialmente persuasiva.

---

## 2. Stack Tecnológico y Principios de Diseño

* **Core 3D:** Three.js (r160) importado vía CDN mediante `<script type="importmap">` en [index.html](file:///Users/pablocesarpalaciosastaiza/Downloads/3D%20custom%20porfolio%20microsoft/index.html).
* **Renderizado:** WebGL con sombras suaves (`PCFSoftShadowMap`), mapeo tonal `ACESFilmicToneMapping` y materiales estándar con acabado de plástico ABS.
* **Sin Bundlers Pesados:** No requiere `npm build` ni Vite/Webpack; corre de forma nativa con ES Modules en cualquier navegador y en **GitHub Pages**.
* **Estilo Visual:** UI flotante estilo *Glassmorphism* sobre una baseplate LEGO con studs instanciados en 3D para máximo rendimiento a 60 FPS.

---

## 3. Mapa de Archivos y Responsabilidades

```
.
├── index.html          # Shell HTML: Topbar, KPIs, Drawer lateral, Controles de cámara,
│                       # Detalle flotante, Tracker de envíos, Lista de flota y Minimapa.
├── css/
│   └── styles.css      # Sistema de diseño WareTrack (glassmorphism, variables CSS,
│                       # tipografía Inter, responsive, animaciones y modo noche).
├── js/
│   ├── data.js         # Modelo de datos central: Distritos, flujos logísticos, modelos de
│   │                   # facturación, matriz de responsabilidad, bundling E3/E5 y checklist.
│   ├── lego.js         # Primitivas geométricas LEGO: Ladrillos redondeados, studs instanciados
│   │                   # (StudBatch), camiones, coches patrulla, drones, montacargas y brackets 3D.
│   ├── city.js         # Generador de la ciudad: Baseplate, sistema vial cuadriculado, aceras,
│   │                   # farolas, vegetación y los 17 edificios temáticos paramétricos.
│   ├── sim.js          # Motor de simulación en tiempo real: Máquina de estados vehicular,
│   │                   # rutas cinemáticas, rondas Zero Trust, drones Copilot, colisiones y KPIs.
│   └── main.js         # Orquestador: Escena Three.js, OrbitControls, raycasting, proyecciones
│                       # de etiquetas 2D/3D, minimapa en canvas, drawer temático y buscador.
├── README.md           # Documentación pública para GitHub.
└── CONTEXT.md          # Este archivo (guía de contexto para Codex / OpenAI).
```

---

## 4. Mapeo del Dominio de Negocio (Microsoft Cloud Architecture)

### 4.1. Los 5 Pilares Representados como Distritos LEGO
1. **Capa Transversal de IA (Ladrillos Violeta `#9B5CD6`):**
   * `copilot`: Rascacielos central con helipuertos y anillos giroscópicos.
   * `copilotStudio`: Laboratorio de orquestación de agentes con cúpula translúcida.
   * `secCopilot`: Centro de respuesta rápida y triage SOC con antena parabólica.
2. **Aplicaciones y Productividad (Ladrillos Naranja `#F28C28`):**
   * `m365`: Torres gemelas con bloques volumétricos de Teams, Word, Excel, PowerPoint y Outlook.
   * `dynamics`: Fábrica industrial para ERP (Finance, Supply Chain) y CRM.
   * `power`: Central de energía renovable con aerogeneradores y base Dataverse.
3. **Infraestructura y Plataforma de Datos (Ladrillos Azules `#1E7BD8`):**
   * `compute`: Datacenter Azure IaaS con racks de servidores con LEDs y ventilación.
   * `azuredata`: Campus Azure PaaS & AI Foundry con núcleo cuántico, Azure SQL, Cosmos DB y AKS.
   * `fabric`: Lakehouse asentado sobre el lago OneLake con capas Delta Parquet.
4. **Seguridad, Identidad y Gobierno (Ladrillos Verdes `#2FA05A`):**
   * `entra`: Gran puerta de la ciudad con barrera móvil y escáner de acceso condicional.
   * `defender`: Cuartel general con escudo gigante y patrullas con sirenas en rondas continuas.
   * `sentinel`: Radar SIEM/SOAR giratorio con barrido de radiofrecuencia.
   * `purview`: Archivo neoclásico con etiquetas flotantes de sensibilidad DLP.
5. **Marcos Contractuales y Partners (Amarillo `#F2C200` y Rojo `#E0453A`):**
   * `ea`: Banco con ciclo trianual y simulador de True-Up.
   * `mcae`: Torre corporativa moderna de contratación digital.
   * `csp`: Comercio con toldos para el canal de partners y NCE.
   * `macc`: Bóveda con lingotes de oro que se acumulan según el gasto y Marketplace 1:1.
   * `hq`, `lsp`, `gsi`: Rascacielos de ventas (comisionado por ACR), almacén de licencias y obra con grúa de migración.

### 4.2. Flujos Logísticos y Máquina de Estados
Cada camión o agente representa un flujo de valor de la nube:
* `LIC`: Licencias USL desde EA/MCA-E/CSP hacia M365/Dynamics.
* `DAT`: Ingesta masiva de datos hacia OneLake.
* `MIG`: Migraciones de máquinas virtuales operadas por GSIs hacia Azure IaaS.
* `ACR`: Azure Consumed Revenue liquidado hacia la bóveda MACC.
* `IDN`, `TLM`, `GOV`: Tokens de identidad, telemetría de amenazas y etiquetas DLP.
* **Ciclo:** `loading` (muelle) ➔ `transit` (calle) ➔ `docking` (bahía) ➔ `unloading` ➔ `reposition`.

---

## 5. Instrucciones para Codex (Backlog de Tareas Pendientes)

Si estás conectándote a este repositorio para refinar, pulir o extender el proyecto, aquí están las mejoras prioritarias:

### Tarea 1: Efectos de Sonido y Audio Feedback (Opcional / Toggle)
* Implementar efectos sonoros sutiles con Web Audio API sintetizada (sin cargar archivos de audio externos pesados):
  * Clic tipo ensamble de pieza LEGO al seleccionar un edificio o camión.
  * Zumbido suave de dron para los agentes Copilot.
  * Sirena suave o pitido electrónico al interceptar una amenaza en Defender.

### Tarea 2: Filtros de Vista y Rayos X
* Añadir un selector de filtros en la barra superior para aislar capas:
  * *Solo Seguridad*: Atenúa el resto de la ciudad y resalta Entra, Defender, Sentinel y Purview con las patrullas.
  * *Solo Datos*: Resalta Fabric, OneLake, Azure SQL, Cosmos DB y los camiones de telemetría `DAT`.
  * *Solo Licenciamiento*: Resalta los bancos EA, MCA-E, CSP y los camiones `LIC`.

### Tarea 3: Exportador de Propuesta Comercial (PDF / Summary)
* En el modo **Optimización** o **Bundling E3 vs E5**, añadir un botón *"Exportar Resumen Ejecutivo"*:
  * Genera una tarjeta o vista para imprimir con los ahorros calculados de MACC, Reservas y Beneficio Híbrido personalizados con el nombre del cliente ingresado en la búsqueda.

### Tarea 4: Soporte Táctil Mejorado para Móviles / Tablets
* Ajustar los gestos táctiles (pinch to zoom, rotación con 2 dedos) para que la experiencia en iPad / tablets sea 100% fluida en presentaciones comerciales con clientes.

---

## 6. Comandos para Ejecutar y Publicar

### Ejecución Local:
```bash
# Servidor local inmediato (cualquier opción funciona)
python3 -m http.server 8080
# o si usas Node:
npx serve .
```
Abre en el navegador: `http://localhost:8080`

### Publicación y Despliegue en GitHub:
```bash
git add .
git commit -m "feat: tu mejora aqui"
git push origin main
```
*GitHub Pages compilará automáticamente en ~30 segundos en la URL oficial:*  
`https://upgradedigitalsas-crypto.github.io/microsoft-cloud-lego-city/`


## 7. Actualización: mundo LEGO vivo y ampliado

La ciudad conserva Three.js r160 con módulos nativos y CDN. La base mide
224 × 164 unidades (2,22 veces la superficie original). Las posiciones de las
20 islas y la red vial se definen en `js/data.js`; cámara, minimapa, patrullas
y rutas usan esa extensión.

`js/landscape.js` añade costa escalonada, árboles cúbicos, canal y nubes.
`js/ecosystem.js` asigna a cada isla un cliente, especialista, necesidad,
resultado y modelo de servicio. `js/customers.js` anima 60 clientes y 20
especialistas con piezas instanciadas: llegada → entrada → uso → salida con
una solución → recorrido. La población es fija y el picking usa `instanceId`.
Los clientes son actores principales; vehículos y drones ilustran flujos del
portafolio. La pestaña Clientes y su detalle explican la relación con Microsoft.

El audio sintetizado, las capas Seguridad/Datos/Licenciamiento y las tarjetas
imprimibles de Optimización/E3–E5 ya están implementados. Los valores comerciales
son escenarios ilustrativos editables; MACC no se trata como descuento automático.
La suite `tests/regression.html` valida 24.000 pasos, visitas, muelles, drones,
picking, colores y propuestas sin instalar herramientas adicionales.

La base rectangular fue reemplazada por una isla irregular en `js/terrain.js`,
con estratos de tierra decrecientes hasta una punta inferior y océano animado
por shader. El núcleo urbano de 224 × 164 conserva las 20 zonas de servicios.


## 8. Ciudad para directivos y playa automatizada

La distribución vigente está en `data.js`; `urban.js` define un bulevar elíptico
y rutas por el sentido más corto. No utilizar X_ROADS/Z_ROADS como red vial:
son referencias históricas. OneLake es un lago central de baldosas LEGO, rodeado
de edificios, paseo y vegetación. Los vehículos y el minimapa usan BOULEVARD.
`executive.js` explica las 20 representaciones con seis recorridos por objetivos.
Power Platform es un taller de automatización, no una central eléctrica.
La playa LEGO tiene un kiosco y robot; `beach.js` simula cuatro etapas de pedido
sin conexiones externas. Buscador, categorías y botón de explorador ocultos.
Mantener ES modules nativos y todo el diseño en LEGO.

## 9. Aeropuerto y protección ilustrativa

`airport.js` añade una península circular al este (240,80), carretera desde HQ,
terminal, torre y un avión reutilizado en un ciclo de 96 segundos. Representa
entrada/salida de datos, sin tráfico real. `security-life.js` reutiliza tres motos
y tres drones Defender/Firewall con escudos: aproximación, bloqueo y retirada.
Los botones de cámara permiten ver ambas escenas y su explicación.
Los letreros ajustan fuente y margen según métricas de glifos. La barra ITSE usa
el toolkit Enterprise: índigo/cian, Inter/Hanken Grotesk y controles compactos.

Las etiquetas flotantes usan glass con iconos Microsoft guardados en assets/products.
SOURCES.md registra sus fuentes; contratos/partners usan símbolos, no logos ficticios.
ResizeObserver conserva tamaños para evitar recortes y solapamientos de etiquetas.

## 10. Iluminación nocturna
`night-lighting.js` crea una vez luces instanciadas, ventanas retroiluminadas,
faros y pilotos, luces de navegación de drones/aviones, balizas y marcas de pista.
El botón día/noche activa/desactiva todo; las balizas parpadean reutilizando objetos.
Se usan materiales luminosos y manchas suaves sin añadir luces con sombras por actor.
La barra superior también usa glass con respaldo opaco para navegadores sin blur.

## 11. Introducción cinematográfica ITSE
El punto de entrada es ahora `intro.js`: partículas Canvas inmediatas, personajes
LEGO 3D de `intro-scene.js`, saludo con camiseta ITSE, despegue, negro y túnel
violeta/índigo/cian. La secuencia dura unos 17 segundos y permite omitirla.
`main.js` se importa dinámicamente durante el vuelo; la ciudad no renderiza
mientras la introducción está visible. Solo se revela tras resolver la importación.
Movimiento reducido omite la película; errores de carga ofrecen reintentar.
La escena introductoria tiene recursos propios y los libera al terminar.
`tests/intro.html` permite inspeccionar caminata, saludo, vuelo y liberación.
La referencia Sparkles se adaptó a módulos nativos, sin React, npm ni bundler.

El túnel usa ahora el shader del componente TunnelHero entregado por el usuario
(96 capas, 128 puntos por anillo, ruta TunnelPath y velocidad originales). Solo
los dos colores cambian a ITSE; resolución usa píxeles reales del framebuffer
para corregir Retina. Comparte renderer con la escena inicial. Las partículas
bajo la línea se concentran en 640×160 con máscara radial y destello blanco.

## 12. Circulación e iluminación revisadas
Los accesos rodean lotes y plazas con un grafo de visibilidad. Los vehículos
reservan un corredor completo antes de salir, esperan por antigüedad y conservan
el muelle de origen durante la maniobra. No existe modo fantasma ni plazas
inventadas fuera del parqueadero. Las patrullas usan el mismo control de paso.
Los peatones siguen un paseo de un sentido con entrada y salida separadas.
Cinco helipuertos independientes y vuelos vertical/crucero/descenso sustituyen
trayectorias diagonales a través de las torres. Fachadas y ventanas tienen mayor
luminosidad nocturna sin luces con sombras adicionales.
El logo ITSE transparente aparece centrado en el túnel con entrada y flotación.

## 13. Torre ITSE en OneLake
`itse-tower.js` construye un rascacielos LEGO escalonado Art Deco sobre una base
en el lago. Una pasarela elevada conecta el vestíbulo con el paseo sur. El logo
original ITSE se representa con ladrillos 3D instanciados sin fondo en la terraza.
Ventanas y baliza se encienden de noche; los drones vuelan por encima de la torre.

La barra vertical de herramientas permite ocultar todas las etiquetas glass y sus líneas. La torre ITSE
tiene un parqueadero de seis plazas al sur del lago, acceso pavimentado desde
el bulevar y paso peatonal hasta la pasarela del vestíbulo.

El encabezado oculta sonido, campana y avisos de novedades. El selector de
capas es compacto y redondeado; las etiquetas se controlan desde la barra vertical.

## 14. Navegación y encabezado compacto
`navigation.js` normaliza delta de rueda/trackpad y aplica zoom exponencial
suavizado por tiempo. OrbitControls conserva rotación con un dedo y zoom/pan
con dos. DPR limitado a 1.25 táctil y 1.75 escritorio para reducir trabajo GPU.
El encabezado inicia contraído con logo y menú en todos los tamaños. En móvil
(hasta 900px), las etiquetas inician apagadas y pueden activarse desde el HUD.
`node tests/navigation.mjs` comprueba unidades, límites, independencia de tasa
de eventos/fotogramas, cancelación táctil y liberación de listeners.

## 15. Recorrido a pie del cliente
`walk.js` ofrece un modo de juego con un cliente LEGO reutilizado que inicia
saliendo de la terminal (222,70). Flechas/WASD y cruceta táctil permiten avanzar,
retroceder y girar; arrastrar cambia la orientación. Cámara de seguimiento baja,
anillo de selección, salida con botón o Escape y restauración de vista anterior.
Limita el paso en lotes de edificios, terminal, pista y agua; permite la pasarela
ITSE. Vehículos y clientes se detienen cerca del personaje controlado.
Al perder foco o cancelar un toque se limpian los controles para evitar marcha
involuntaria. El modo no crea personajes nuevos cada vez que se activa.

El recorrido permite mirar arriba, abajo y a los lados arrastrando mouse o dedo. La inclinación está limitada a −60°/+80° para evitar inversiones; perder captura cancela el gesto. Versión: 20261017-walk-look-1.

Barra vertical: iconos SVG locales coherentes (zoom, rotación, encuadre, muñeco amarillo de recorrido, edificio, avión, escudo, etiquetas y luna/sol). Todos tienen nombres accesibles; día/noche conserva el SVG y actualiza su estado. Versión 20261017-icons-1.

## 16. Equipos dentro de la torre ITSE
Torre Art Deco LEGO con acabados gris acero, retranqueos y corona estriada. Seis pisos abiertos al frente muestran 18 minifiguras animadas: Soporte/Mesa de ayuda, Ciberseguridad, Comercial, C-LEVELS, Entrenamiento y Development Seniors IA. Cada piso lleva rótulo, estaciones y monitores; soporte tiene auriculares y SOC/IA racks. Mantiene altura, logo, pasarela, parqueadero y límites de navegación. Versión 20261017-itse-staff-1.

Hover sobre edificios de portafolio: brackets cian, etiqueta glass y línea guía aun con etiquetas apagadas; raycast limitado a ~16 Hz. Clic encuadra al frente (+Z) según altura, ancho, FOV y aspect ratio, con margen 45%. Sin hover táctil ni durante recorrido o arrastre. Versión 20261017-hover-focus-1.

Torre ITSE incluida en picking: hover con contorno y etiqueta, clic/etiqueta/botón encuadran frontalmente según FOV y pantalla. Staff alterna tecleo, llamadas y gestos; un trabajador por planta recorre 0.85 unidades del pasillo detrás del escritorio y regresa, sin crear actores por frame. Versión 20261017-itse-hover-life-1.

Cámara orbital: permite mirar desde abajo (ángulo polar hasta 153°), acercamiento mínimo 6 y paneo en pantalla. Botones subir/bajar trasladan cámara y objetivo 4 unidades; suelo mínimo y=1.2 fuera del modo a pie. Toolbar desplazable para mantener accesibles las herramientas en pantallas cortas. Versión 20261017-camera-height-1.

Barra de herramientas sin scrollbar visible: conserva desplazamiento nativo con rueda, trackpad y toque. En pantallas bajas, la fila horizontal permite deslizar y convierte la rueda vertical a desplazamiento horizontal. Versión 20261017-toolbar-slide-1.

HUD del recorrido compacto: sin tarjeta; cruceta circular SVG inferior izquierda y botón Salir de 104×44 inferior derecho con expansión del círculo violeta (referencia MotionButton). Zona central deja pasar gestos, safe areas y movimiento reducido soportados. Adaptación nativa sin React/Tailwind/Lottie ni dependencias. Versión 20261017-walk-hud-1.

Ficha de producto al seleccionar edificios: explicación Qué es / Para qué sirve / Capacidades con datos existentes, logotipos locales y SVG en lugar de emojis. Panel no modal, cierre por Escape, vista frontal y formato inferior compacto en móvil. Sin contadores ficticios de actividad en la ficha de programa. Versión 20261017-product-popup-1.

## 17. Fichas ejecutivas y fuentes oficiales
`product-briefs.js` contiene 20 síntesis ejecutivas en español con fuente oficial Microsoft y fecha de revisión 2026-10-18: visión, valor, usos, evaluación e indicadores editoriales. 11 productos tienen video introductorio extraído de reproductores de páginas oficiales Microsoft (procedencia en `research/video-discovery.json`). Video HTML nativo sin descarga local ni dependencias, cargado solo al pulsar; sin autoplay al abrir ficha, enlace alternativo a Microsoft y transcripción cuando existe. Se detiene y libera al cambiar/cerrar ficha. Las 9 fichas sin video verificado conservan enlace documental sin reproductor vacío. Versión 20261018-executive-briefs-1.
