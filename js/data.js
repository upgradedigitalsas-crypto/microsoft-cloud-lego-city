// ============================================================================
//  Datos del portafolio Microsoft Cloud (fuente: Arquitectura Estratégica v1.0.0)
// ============================================================================

export const DOC = {
  title: 'Arquitectura Estratégica del Portafolio Microsoft Cloud y Modelo As-a-Service',
  category: 'Enterprise Cloud Architecture & Strategy',
  version: '1.0.0',
  last_updated: '2026-10-15',
  status: 'active',
  tags: ['microsoft-cloud', 'azure', 'microsoft-365', 'dynamics-365', 'iaas-paas-saas', 'enterprise-licensing', 'cloud-economics'],
};

// Paleta LEGO por pilar
export const PILLARS = {
  ai:         { name: 'Capa Agéntica · IA',              color: '#9B5CD6', layer: 1 },
  apps:       { name: 'Aplicaciones y Productividad',    color: '#F28C28', layer: 2 },
  data:       { name: 'Infraestructura y Datos',         color: '#1E7BD8', layer: 3 },
  security:   { name: 'Seguridad, Identidad y Gobierno', color: '#2FA05A', layer: 4 },
  commercial: { name: 'Contratos y Economía Cloud',      color: '#F2C200', layer: 5 },
  partners:   { name: 'Equipo de Cuenta y Partners',     color: '#E0453A', layer: 6 },
};

// Malla vial de la ciudad
export const X_ROADS = [-68, -23, 23, 68];
export const Z_ROADS = [-44, 0, 44];
export const PLATE = { minX: -112, maxX: 112, minZ: -82, maxZ: 82 };

// ---------------------------------------------------------------------------
// Distritos (edificios). pos = centro de manzana [x, z]
// ---------------------------------------------------------------------------
export const DISTRICTS = [
  // ---------------- CAPA IA (fila trasera) ----------------
  {
    id: 'copilotStudio', name: 'Copilot Studio', short: 'Copilot Studio', pillar: 'ai', kind: 'lab',
    pos: [-45, -61], model: 'SaaS', billing: 'Por mensajes / capacidad',
    desc: 'Entorno para orquestar agentes autónomos que se integran a APIs externas, sistemas ERP y flujos lógicos mediante el estándar de conectores de Microsoft.',
    items: ['Agentes autónomos', 'Conectores', 'Integración ERP', 'Flujos lógicos'],
  },
  {
    id: 'copilot', name: 'Microsoft 365 Copilot', short: 'Copilot Tower', pillar: 'ai', kind: 'copilotTower',
    pos: [0, -61], model: 'SaaS', billing: 'Por puesto (USL)',
    desc: 'Capa transversal de IA: asistentes embebidos especializados por contexto de aplicación (M365, GitHub, Security, Dynamics). Desde aquí despegan los agentes Copilot que asisten a todos los distritos.',
    items: ['M365 Copilot', 'GitHub Copilot', 'Dynamics Copilot', 'Microsoft Graph'],
  },
  {
    id: 'secCopilot', name: 'Security Copilot', short: 'Security Copilot', pillar: 'ai', kind: 'lab2',
    pos: [45, -61], model: 'SaaS', billing: 'Capacidad (SCUs)',
    desc: 'Asistente de IA para equipos SOC: triage de incidentes, análisis de amenazas y respuesta guiada sobre Defender, Sentinel, Entra y Purview.',
    items: ['Triage de incidentes', 'Threat intel', 'Guías de respuesta', 'KQL asistido'],
  },

  // ---------------- APLICACIONES ----------------
  {
    id: 'm365', name: 'Microsoft 365', short: 'Microsoft 365', pillar: 'apps', kind: 'officeTower',
    pos: [-45, -22], model: 'SaaS', billing: 'Por puesto (USL) · E3 / E5',
    desc: 'Aplicaciones de escritorio y web, mensajería empresarial y gestión de puestos de trabajo. Evoluciona de suite de oficina hacia un centro de operaciones de datos no estructurados y grafos organizacionales (Microsoft Graph).',
    items: ['Teams', 'Office (Word, Excel, PowerPoint)', 'Exchange Online', 'SharePoint', 'OneDrive', 'Windows 11 Enterprise', 'Intune'],
  },
  {
    id: 'dynamics', name: 'Dynamics 365', short: 'Dynamics 365', pillar: 'apps', kind: 'factory',
    pos: [0, -22], model: 'SaaS', billing: 'Por puesto (USL)',
    desc: 'Cobertura de procesos críticos de misión empresarial modularizados en ERP (Finance, Supply Chain Management) y CRM (Customer Service, Sales, Field Service).',
    items: ['Finance', 'Supply Chain', 'Sales', 'Customer Insights', 'Customer Service', 'Field Service'],
  },
  {
    id: 'power', name: 'Power Platform', short: 'Power Platform', pillar: 'apps', kind: 'powerPlant',
    pos: [45, -22], model: 'SaaS', billing: 'Por usuario / por app · Dataverse',
    desc: 'Capa Low-Code/No-Code que democratiza la construcción de apps internas (Power Apps), flujos automatizados (Power Automate), agentes conversacionales y visualización de datos (Power BI), todos sobre Microsoft Dataverse.',
    items: ['Power Apps', 'Power Automate', 'Power BI', 'Dataverse', 'Agentes virtuales'],
  },

  // ---------------- INFRAESTRUCTURA Y DATOS ----------------
  {
    id: 'compute', name: 'Azure Compute (IaaS)', short: 'Azure IaaS', pillar: 'data', kind: 'datacenter',
    pos: [-45, 22], model: 'IaaS', billing: 'Consumo puro (vCPU·s, GB egress, IOPS)',
    desc: 'Provisión de recursos fundamentales de red virtualizada, almacenamiento escalable (Azure Blob, NetApp Files) y cómputo (Virtual Machines, Dedicated Hosts).',
    items: ['Virtual Machines', 'Dedicated Hosts', 'Azure Blob', 'NetApp Files', 'Redes virtuales'],
  },
  {
    id: 'azuredata', name: 'Azure PaaS + AI Foundry', short: 'Azure PaaS & AI', pillar: 'data', kind: 'aiCampus',
    pos: [0, 22], model: 'PaaS', billing: 'Consumo puro (llamadas API, RU/s, vCore)',
    desc: 'Entornos de ejecución y bases de datos gestionadas donde el cliente se enfoca en el código o esquema. Azure OpenAI y AI Foundry despliegan modelos fundacionales con privacidad y residencia empresarial.',
    items: ['AKS', 'App Services', 'Azure SQL Database', 'Cosmos DB', 'Azure OpenAI', 'AI Foundry'],
  },
  {
    id: 'fabric', name: 'Microsoft Fabric · OneLake', short: 'Fabric / OneLake', pillar: 'data', kind: 'lakehouse',
    pos: [45, 22], model: 'SaaS analítico', billing: 'Capacidad (SKUs F · CUs)',
    desc: 'Unifica Data Warehouses y lagos analíticos bajo una única réplica de datos (OneLake). Lakehouse en Delta Parquet, Synapse Analytics, Data Factory y Data Mesh.',
    items: ['OneLake', 'Lakehouse / Delta Parquet', 'Synapse Analytics', 'Data Factory', 'Power BI Premium'],
  },

  // ---------------- SEGURIDAD (fila frontal = perímetro) ----------------
  {
    id: 'entra', name: 'Microsoft Entra', short: 'Entra ID', pillar: 'security', kind: 'gate',
    pos: [-45, 61], model: 'SaaS', billing: 'Por usuario (P1 / P2)',
    desc: 'Gestión de identidades y accesos (IAM, CIAM, Zero Trust). Controla el ciclo de vida del usuario, MFA condicional y privilegios mínimos. Es la puerta de toda la ciudad.',
    items: ['IAM / CIAM', 'Zero Trust', 'MFA condicional', 'Privilegios mínimos'],
  },
  {
    id: 'defender', name: 'Microsoft Defender', short: 'Defender XDR', pillar: 'security', kind: 'shieldHQ',
    pos: [0, 61], model: 'SaaS', billing: 'Por usuario / por servidor',
    desc: 'Suite XDR para protección de endpoints, identidades locales y cloud, correo electrónico y contenedores. Sus patrullas recorren la ciudad.',
    items: ['Endpoint', 'Identity', 'Office 365', 'Cloud / Containers'],
  },
  {
    id: 'sentinel', name: 'Microsoft Sentinel', short: 'Sentinel SIEM', pillar: 'security', kind: 'radar',
    pos: [45, 61], model: 'SaaS', billing: 'Consumo (GB ingeridos)',
    desc: 'Plataforma cloud-native SIEM con orquestación y respuesta automatizada (SOAR). Recibe telemetría de toda la ciudad.',
    items: ['SIEM', 'SOAR', 'Analítica KQL', 'Playbooks'],
  },
  {
    id: 'purview', name: 'Microsoft Purview', short: 'Purview DLP', pillar: 'security', kind: 'archive',
    pos: [87, 61], model: 'SaaS', billing: 'Por usuario / consumo',
    desc: 'Gobierno, protección de información clasificada, cumplimiento normativo y auditoría de prevención de fuga de datos (DLP).',
    items: ['DLP', 'Etiquetas de sensibilidad', 'eDiscovery', 'Auditoría', 'Data Map'],
  },

  // ---------------- CONTRATOS (columna izquierda) ----------------
  {
    id: 'csp', name: 'CSP · Canal Partners', short: 'CSP / NCE', pillar: 'commercial', kind: 'shop',
    pos: [-87, -61], model: 'Contrato', billing: 'Mensual (+~20%) o anual NCE',
    desc: 'Orientado a SMB / mid-market que tercerizan gestión técnica y facturación a un MSP. New Commerce Experience: flexibilidad mensual con recargo ~20% o anual fijo no cancelable.',
    items: ['Mid-market / SMB', 'Facturación mensual', 'Margen del partner', 'NCE'],
  },
  {
    id: 'ea', name: 'Enterprise Agreement', short: 'EA', pillar: 'commercial', kind: 'bank',
    pos: [-87, -22], model: 'Contrato', billing: 'Compromiso 3 años · True-up anual',
    desc: 'Canal tradicional para >500 puestos (o 2.400 según región). Precios congelados durante 3 años. True-up: 11 meses de despliegue libre, conciliación en el mes 12 sin penalización retroactiva.',
    items: ['>500 seats', '3 años', 'Precios congelados', 'True-up anual'],
  },
  {
    id: 'mcae', name: 'MCA-E · Canal Moderno', short: 'MCA-E', pillar: 'commercial', kind: 'modernOffice',
    pos: [-87, 22], model: 'Contrato', billing: 'Digital · consumo unificado',
    desc: 'Microsoft Customer Agreement for Enterprise: contratación digital que sustituye gradualmente al EA. Elimina enmiendas en papel y centraliza perfiles de facturación en el portal unificado.',
    items: ['Grandes corporativos', 'Contrato digital', 'Perfiles de facturación', 'Consumo ágil'],
  },
  {
    id: 'macc', name: 'MACC Vault', short: 'MACC', pillar: 'commercial', kind: 'vault',
    pos: [-87, 61], model: 'Compromiso', billing: 'Gasto mínimo 3–5 años',
    desc: 'Microsoft Azure Consumption Commitment: compromiso de gasto mínimo (ej. $5M USD) a cambio de descuentos, créditos AMMP e ingeniería. El gasto elegible en Azure Marketplace descuenta 1:1 del saldo.',
    items: ['Compromiso $5M', 'Créditos AMMP', 'Marketplace 1:1', 'Reservas + AHB'],
  },

  // ---------------- PARTNERS (columna derecha) ----------------
  {
    id: 'hq', name: 'Equipo de Cuenta Microsoft', short: 'Account Team HQ', pillar: 'partners', kind: 'hq',
    pos: [87, -61], model: 'Fuerza de ventas', billing: 'Compensación por ACR',
    desc: 'Estructura matricial: Account Executive / Client Director (relación y negociación), Solution Specialists (venta técnica Data/AI, Infra, Modern Work) y Cloud Solution Architects (ingeniería pre y post-venta, comisionados por Azure Consumed Revenue).',
    items: ['Account Executive', 'Solution Specialists', 'Cloud Solution Architects', 'ACR'],
  },
  {
    id: 'lsp', name: 'LSP · Licensing Solution Partner', short: 'LSP', pillar: 'partners', kind: 'warehouse',
    pos: [87, -22], model: 'Partner', billing: 'Transaccional',
    desc: 'Crayon, SoftwareOne, Insight: operación transaccional y gestión de contratos EA / MCA-E.',
    items: ['Crayon', 'SoftwareOne', 'Insight', 'Gestión EA/MCA-E'],
  },
  {
    id: 'gsi', name: 'GSI · Global Systems Integrator', short: 'GSI', pillar: 'partners', kind: 'construction',
    pos: [87, 22], model: 'Partner', billing: 'Proyectos',
    desc: 'Accenture/Avanade, PwC, Kyndryl, Deloitte: migración e implementación de cargas hacia Azure y modernización.',
    items: ['Accenture / Avanade', 'PwC', 'Kyndryl', 'Deloitte'],
  },
];

// ---------------------------------------------------------------------------
// Flujos logísticos (lo que mueven los camiones LEGO)
// ---------------------------------------------------------------------------
export const FLOWS = [
  { type: 'license',   label: 'Licencias USL',        prefix: 'LIC', color: '#F2C200', from: ['ea', 'mcae', 'csp'],          to: ['m365', 'dynamics', 'power'], count: 4, unit: 'licencias' },
  { type: 'data',      label: 'Datos → OneLake',      prefix: 'DAT', color: '#1E7BD8', from: ['m365', 'dynamics', 'azuredata', 'power'], to: ['fabric'], count: 3, unit: 'TB' },
  { type: 'migration', label: 'Migración de cargas',  prefix: 'MIG', color: '#E0453A', from: ['gsi'],                        to: ['compute', 'azuredata'], count: 2, unit: 'VMs' },
  { type: 'acr',       label: 'Consumo ACR → MACC',   prefix: 'ACR', color: '#2FA05A', from: ['compute', 'azuredata', 'fabric'], to: ['macc'], count: 3, unit: 'USD' },
  { type: 'contract',  label: 'Órdenes / True-up',    prefix: 'ORD', color: '#FFFFFF', from: ['lsp'],                        to: ['ea', 'mcae'], count: 1, unit: 'órdenes' },
  { type: 'identity',  label: 'Tokens de identidad',  prefix: 'IDN', color: '#7ED957', from: ['entra'],                      to: ['m365', 'dynamics', 'compute', 'power'], count: 2, unit: 'tokens' },
  { type: 'telemetry', label: 'Señales XDR → SIEM',   prefix: 'TLM', color: '#3D3D3D', from: ['defender', 'm365', 'compute'], to: ['sentinel'], count: 2, unit: 'GB' },
  { type: 'gov',       label: 'Etiquetas DLP',        prefix: 'GOV', color: '#8A63D2', from: ['purview'],                    to: ['fabric', 'm365'], count: 1, unit: 'políticas' },
  { type: 'deal',      label: 'Propuesta comercial',  prefix: 'DEA', color: '#E0453A', from: ['hq'],                         to: ['ea', 'mcae', 'csp', 'gsi'], count: 1, unit: 'propuestas' },
];

export const CUSTOMERS = ['Contoso', 'Fabrikam', 'Northwind', 'Tailspin', 'Woodgrove Bank', 'Litware', 'Adventure Works', 'Proseware'];
export const DRIVERS = ['Ana Ruiz', 'Diego Mora', 'Lucía Pérez', 'Mateo Gil', 'Sofía León', 'Tomás Vega', 'Valeria Cruz', 'Andrés Rojas', 'Camila Soto', 'Julián Ríos', 'Isabel Mejía', 'Nicolás Paz', 'Paula Díaz', 'Martín Sanz', 'Elena Vidal', 'Hugo Castro', 'Laura Pino', 'Bruno Reyes', 'Sara Ortiz', 'Iván Luna'];

export const COPILOT_TASKS = {
  m365: ['Resumen de reunión en Teams', 'Borrador de correo en Outlook', 'Análisis en Excel'],
  dynamics: ['Pronóstico de Supply Chain', 'Siguiente mejor acción en Sales', 'Conciliación en Finance'],
  power: ['Generar flujo de Power Automate', 'Crear app con lenguaje natural', 'Narrativa en Power BI'],
  compute: ['Recomendación de rightsizing', 'Diagnóstico de VM'],
  azuredata: ['Optimizar consulta SQL', 'Desplegar modelo en AI Foundry'],
  fabric: ['Notebook asistido', 'Modelo semántico automático'],
  sentinel: ['Triage de incidente', 'Hunting KQL asistido'],
  defender: ['Análisis de malware', 'Aislar endpoint'],
  purview: ['Clasificar documentos sensibles'],
  entra: ['Revisión de accesos'],
  hq: ['Preparar QBR del cliente'],
};

export const EVENTS = [
  ['security', 'Defender bloqueó una campaña de phishing dirigida a Finance'],
  ['security', 'Entra aplicó acceso condicional: inicio de sesión de riesgo alto bloqueado'],
  ['security', 'Sentinel correlacionó 14 alertas en 1 incidente (SOAR ejecutado)'],
  ['security', 'Purview detuvo una fuga de datos: archivo "Confidencial" hacia USB'],
  ['commercial', 'EA de Contoso: True-up en 23 días · 312 licencias por conciliar'],
  ['commercial', 'MACC de Fabrikam superó el 60% del compromiso'],
  ['commercial', 'Compra en Azure Marketplace (Datadog) descontada 1:1 del MACC'],
  ['commercial', 'CSP NCE: cliente pasó de mensual a anual (−20% recargo)'],
  ['data', 'AKS escaló a 48 nodos por pico de demanda'],
  ['data', 'OneLake ingirió 2.4 TB desde Dynamics 365 Supply Chain'],
  ['data', 'Azure OpenAI: nuevo deployment GPT en región con residencia de datos'],
  ['ai', 'Copilot Studio publicó un agente conectado al ERP'],
  ['ai', 'M365 Copilot: 1.200 resúmenes de reuniones generados hoy'],
  ['partners', 'GSI completó la ola 3 de migración (120 VMs)'],
  ['partners', 'CSA aseguró paso a producción: +$42K ACR mensual'],
  ['apps', 'Teams Phone reemplazó a la telefonía legada en 3 sedes'],
];

// ---------------------------------------------------------------------------
// Responsabilidad compartida
// ---------------------------------------------------------------------------
export const RESPONSIBILITY = {
  layers: ['Acceso y Datos', 'Aplicaciones', 'Controles de Red', 'Sistema Operativo', 'Capa de Virtualización', 'Hardware y Servidores', 'Red Física y Datacenter'],
  models: {
    onprem: { label: 'On-Premises', who: ['E', 'E', 'E', 'E', 'E', 'E', 'E'], buildings: [] },
    iaas:   { label: 'IaaS · Azure VMs', who: ['E', 'E', 'E', 'E', 'M', 'M', 'M'], buildings: ['compute'] },
    paas:   { label: 'PaaS · Azure SQL / AKS', who: ['E', 'E', 'C', 'M', 'M', 'M', 'M'], buildings: ['azuredata'] },
    saas:   { label: 'SaaS · M365 / Dynamics', who: ['E', 'M', 'M', 'M', 'M', 'M', 'M'], buildings: ['m365', 'dynamics', 'power', 'fabric'] },
  },
};

// ---------------------------------------------------------------------------
// Modalidades de consumo
// ---------------------------------------------------------------------------
export const BILLING = [
  { id: 'consumption', name: 'Consumo puro', scope: 'Azure IaaS y PaaS', metrics: 'vCPU·s, GB egress, IOPS, llamadas API', buildings: ['compute', 'azuredata', 'sentinel'], color: '#1E7BD8' },
  { id: 'seat', name: 'Por puesto (USL)', scope: 'M365, Dynamics 365, Power Apps, Copilot', metrics: 'Cuota fija mensual/anual por identidad', buildings: ['m365', 'dynamics', 'power', 'copilot', 'entra', 'defender', 'purview'], color: '#F28C28' },
  { id: 'capacity', name: 'Capacidad dedicada', scope: 'Fabric (SKUs F), Power BI Premium, Databricks', metrics: 'Capacity Units (CUs) reservadas o elásticas', buildings: ['fabric', 'secCopilot', 'copilotStudio'], color: '#9B5CD6' },
];

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------
export const CONTRACTS = [
  { id: 'mcae', name: 'MCA-E', tag: 'Canal Moderno', points: ['Grandes corporativos', 'Contrato digital', 'Consumo ágil unificado'], color: '#1E7BD8' },
  { id: 'ea', name: 'EA', tag: 'Canal Tradicional', points: ['Clientes >500 seats', 'Compromiso 3 años', 'Proceso True-up anual'], color: '#F2C200' },
  { id: 'csp', name: 'CSP', tag: 'Canal Partners', points: ['Mid-market / SMB', 'Facturación mensual', 'Margen del partner'], color: '#2FA05A' },
];

// ---------------------------------------------------------------------------
// Bundling E3 → E5 (precios ilustrativos USD / usuario / mes)
// ---------------------------------------------------------------------------
export const BUNDLE = {
  e3: 36, e5: 57,
  vendors: [
    { name: 'Okta', role: 'Gestión de identidad', price: 6, replacedBy: 'Entra ID P2', color: '#2E5BFF' },
    { name: 'CrowdStrike / SentinelOne', role: 'EDR / XDR', price: 8, replacedBy: 'Defender for Endpoint', color: '#E0453A' },
    { name: 'Zoom / Webex', role: 'Reuniones y telefonía', price: 4, replacedBy: 'Teams Phone', color: '#2D8CFF' },
    { name: 'Proofpoint', role: 'Seguridad de email', price: 3.5, replacedBy: 'Defender for Office', color: '#16A085' },
    { name: 'Zscaler / Netskope', role: 'DLP / CASB', price: 4, replacedBy: 'Purview + Defender for Cloud Apps', color: '#7F8C8D' },
  ],
};

// ---------------------------------------------------------------------------
// Checklist de negociación
// ---------------------------------------------------------------------------
export const CHECKLIST = [
  { id: 'idle', title: 'Auditoría de inactividad de licencias', text: 'Evaluar cuántas licencias E3/E5 asignadas no registran actividad superior a 30 días.', target: 'm365' },
  { id: 'dup', title: 'Mapeo de soluciones duplicadas', text: 'Identificar SaaS de terceros ya cubiertos por el licenciamiento base (firmas electrónicas, almacenamiento, telefonía IP).', target: 'lsp' },
  { id: 'macc', title: 'Proyección realista de consumo cloud', text: 'Evitar sobredimensionar el MACC para un tramo de descuento mayor si la migración no está asegurada.', target: 'macc' },
  { id: 'ahb', title: 'Alineación con Azure Hybrid Benefit', text: 'Verificar inventario Windows Server / SQL Server con SA vigente antes de dimensionar instancias reservadas.', target: 'compute' },
  { id: 'price', title: 'Términos de protección de precios', text: 'Negociar topes máximos de incremento porcentual para renovaciones SaaS al término del acuerdo trianual.', target: 'ea' },
];

// Equipo de cuenta
export const ROLES = [
  { name: 'Account Executive / Client Director', text: 'Líder de la relación global y negociador comercial principal.', target: 'hq' },
  { name: 'Solution Specialists (SSPs)', text: 'Venta técnica especializada (Data/AI, Infra, Modern Work).', target: 'hq' },
  { name: 'Cloud Solution Architects (CSAs)', text: 'Ingeniería pre y post-venta. Comisionados por Azure Consumed Revenue (ACR).', target: 'compute' },
  { name: 'LSP · Licensing Solution Partner', text: 'Crayon, SoftwareOne, Insight · operación transaccional EA/MCA-E.', target: 'lsp' },
  { name: 'GSI · Global Systems Integrator', text: 'Accenture/Avanade, PwC, Kyndryl, Deloitte · migración e implementación.', target: 'gsi' },
];
