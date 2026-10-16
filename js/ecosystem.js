// Each character has a job in the Microsoft Cloud story, rather than being traffic.
export const SERVICE_ROLES = {
  copilotStudio: { role: 'Creador de agentes', host: 'Orquestador Copilot Studio', need: 'Automatizar atención al cliente', result: 'Agente conectado al ERP', model: 'SaaS' },
  copilot: { role: 'Usuario de Copilot', host: 'Asistente Microsoft 365', need: 'Preparar una reunión de negocio', result: 'Resumen y acciones de Teams', model: 'SaaS' },
  secCopilot: { role: 'Analista SOC', host: 'Security Copilot', need: 'Investigar una alerta', result: 'Triage y guía de respuesta', model: 'SaaS' },
  m365: { role: 'Equipo de colaboración', host: 'Administrador Microsoft 365', need: 'Colaborar con su equipo', result: 'Espacio de trabajo en Teams', model: 'SaaS' },
  dynamics: { role: 'Responsable de operaciones', host: 'Operador Dynamics 365', need: 'Conectar ventas e inventario', result: 'Pedido procesado en ERP / CRM', model: 'SaaS' },
  power: { role: 'Creador de aplicaciones', host: 'Maker Power Platform', need: 'Automatizar un proceso interno', result: 'App y flujo sobre Dataverse', model: 'SaaS' },
  compute: { role: 'Arquitecto de infraestructura', host: 'Operador Azure IaaS', need: 'Desplegar capacidad de cómputo', result: 'VM y red virtual listas', model: 'IaaS' },
  azuredata: { role: 'Desarrollador de aplicaciones', host: 'Ingeniero Azure PaaS', need: 'Publicar una app con datos e IA', result: 'App + Azure SQL + API de IA', model: 'PaaS' },
  fabric: { role: 'Analista de datos', host: 'Ingeniero Microsoft Fabric', need: 'Unificar los datos del negocio', result: 'Lakehouse y reporte en OneLake', model: 'SaaS' },
  entra: { role: 'Usuario corporativo', host: 'Guardián Microsoft Entra', need: 'Acceder con identidad verificada', result: 'Acceso con MFA y privilegio mínimo', model: 'IAM' },
  defender: { role: 'Responsable de seguridad', host: 'Analista Defender XDR', need: 'Proteger los equipos del cliente', result: 'Endpoint protegido', model: 'XDR' },
  sentinel: { role: 'Investigador de amenazas', host: 'Operador Sentinel', need: 'Correlacionar señales de seguridad', result: 'Incidente investigado y playbook', model: 'SIEM' },
  purview: { role: 'Responsable de datos', host: 'Gobernador Microsoft Purview', need: 'Clasificar información sensible', result: 'Datos etiquetados y política DLP', model: 'DLP' },
  csp: { role: 'Cliente pyme', host: 'Partner CSP', need: 'Contratar servicios con soporte', result: 'Suscripción administrada por partner', model: 'CSP' },
  ea: { role: 'Comprador corporativo', host: 'Especialista de licencias EA', need: 'Consolidar licencias corporativas', result: 'Acuerdo y revisión de puestos', model: 'EA' },
  mcae: { role: 'Responsable de compras', host: 'Asesor MCA-E', need: 'Organizar la compra de Microsoft Cloud', result: 'Perfil de facturación unificado', model: 'MCA-E' },
  macc: { role: 'Responsable FinOps', host: 'Especialista de consumo Azure', need: 'Planificar el consumo comprometido', result: 'Plan de consumo y optimización', model: 'FinOps' },
  hq: { role: 'Líder de transformación', host: 'Cloud Solution Architect', need: 'Diseñar su arquitectura cloud', result: 'Hoja de ruta de adopción', model: 'CSA' },
  lsp: { role: 'Gestor de licenciamiento', host: 'Licensing Solution Partner', need: 'Revisar contratos y suscripciones', result: 'Inventario y renovación de licencias', model: 'LSP' },
  gsi: { role: 'Líder de migración', host: 'Global Systems Integrator', need: 'Modernizar las cargas del negocio', result: 'Ola de migración hacia Azure', model: 'GSI' },
};

export const CUSTOMER_STATES = {
  arriving: 'Llegando a la isla', entering: 'Entrando al servicio',
  using: 'Usando el servicio', leaving: 'Saliendo con una solución',
  strolling: 'Recorriendo el ecosistema', welcoming: 'Recibiendo clientes',
};
