# CloudCity · Portafolio Microsoft Cloud 3D (LEGO Digital Twin)

Un gemelo digital en 3D interactivo construido como una **ciudad LEGO** para explorar visualmente la **Arquitectura Estratégica del Portafolio Microsoft Cloud y su Modelo As-a-Service**.

Inspirado en la interfaz y telemetría de centros de distribución modernos (*WareTrack*), integrando simulación en tiempo real y dashboards analíticos.

![CloudCity Preview](https://img.shields.io/badge/Microsoft_Cloud-Architecture_v1.0.0-0078D4?style=for-the-badge&logo=microsoft)
![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=for-the-badge&logo=three.js)
![LEGO 3D](https://img.shields.io/badge/Style-LEGO_Plastic_ABS-E0453A?style=for-the-badge)

---

## 🏛️ Estructura de la Ciudad

La ciudad representa los 5 pilares funcionales de Microsoft Cloud como distritos con edificios temáticos y ladrillos ABS:

1. **Capa Transversal de Inteligencia Artificial (Violeta)**:
   - **Copilot Tower**: Rascacielos con helipuertos de drones agénticos y anillos orbitales.
   - **Copilot Studio**: Laboratorio con cúpula traslúcida y orquestación de agentes externos.
   - **Security Copilot**: Centro de respuesta rápida SOC y triage de amenazas asistido.
2. **Aplicaciones y Productividad (Naranja)**:
   - **Microsoft 365**: Torres de oficinas con módulos para Teams, Office, Exchange, SharePoint y Windows 11 Enterprise.
   - **Dynamics 365**: Fábrica con techo shed industrial, chimenea y montacargas para ERP (Finance/Supply Chain) y CRM.
   - **Power Platform**: Central de energía para Power Apps, Power Automate y Power BI sobre Dataverse.
3. **Infraestructura y Plataforma de Datos (Azul)**:
   - **Azure IaaS**: Datacenter con servidores en racks con LEDs de actividad y ventilación industrial.
   - **Azure PaaS & AI Foundry**: Campus con núcleo de IA y bases de datos gestionadas (SQL, Cosmos DB, AKS).
   - **Microsoft Fabric / OneLake**: Lakehouse junto a un lago translúcido (OneLake) y capas Delta Parquet.
4. **Seguridad, Identidad y Gobierno (Verde)**:
   - **Microsoft Entra ID**: Puerta principal de la ciudad con barrera automatizada y control de acceso condicional Zero Trust.
   - **Microsoft Defender XDR**: Cuartel perimetral con escudo gigante y patrullas con sirenas en rondas continuas.
   - **Microsoft Sentinel**: Radar SIEM/SOAR de alta frecuencia con haz de barrido de incidentes.
   - **Microsoft Purview**: Archivo clásico de gobierno y prevención de fuga de datos (DLP).
5. **Marcos Contractuales y Fuerza de Ventas (Amarillo / Rojo)**:
   - **Enterprise Agreement (EA)**: Banco con ciclo trianual y True-up anual interactivo.
   - **MCA-E (Canal Moderno)**: Oficina digital unificada.
   - **CSP (Canal Partners)**: Canal NCE para SMB con flexibilidad mensual (+20%) o anual.
   - **MACC Vault**: Bóveda con lingotes de oro que se van completando con el consumo de Azure y compras 1:1 en Marketplace.
   - **Account Team HQ, LSP & GSI**: Torres y grúas de migración de cargas.

---

## 🚛 Operación Logística en Tiempo Real

* **Flota de camiones LEGO**: Máquina de estados (*Cargando ➔ En ruta ➔ Acoplando ➔ Descargando*).
* **Drones Copilot**: Despegue autónomo para asistir en tareas generativas a cada distrito.
* **Corchetes 3D (WareTrack)**: Selección interactiva de vehículos y edificios con telemetría en vivo.
* **Minimapa 2D en tiempo real**: Canvas interactivo con coordenadas y navegación con un clic.
* **Calculadoras estratégicas integradas**:
  - Comparador E3 vs. E5 (*The Bundling Play*).
  - Calculadora de ahorro MACC + Reservas (RIs) + Azure Hybrid Benefit (AHB).
  - Matriz del Modelo de Responsabilidad Compartida.
  - Simulador de 12 meses de True-up.

---

## ⚡ Despliegue en GitHub Pages

Al ser una aplicación web estática (Vanilla JS + ES Modules + Three.js via CDN), no requiere ningún paso de compilación (`npm build`):

1. Ve a tu repositorio en GitHub: **Settings > Pages**.
2. En **Build and deployment > Source**, selecciona **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`.
4. Haz clic en **Save**. ¡Tu ciudad 3D estará en línea en un minuto!
