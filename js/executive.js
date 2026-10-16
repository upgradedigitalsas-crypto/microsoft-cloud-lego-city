// Business outcomes are illustrative capabilities, never guaranteed financial returns.
export const CITY_STORIES = {
  compute: ['Centro de datos Azure', 'Ejecutar y escalar las cargas de la empresa', 'Máquinas virtuales, almacenamiento y redes son la infraestructura de la ciudad.', 'Disponibilidad, utilización y costo por carga'],
  azuredata: ['Campus de desarrollo e IA', 'Crear aplicaciones y experiencias inteligentes', 'Los equipos construyen sobre bases de datos, plataformas y modelos gestionados.', 'Tiempo de entrega, calidad y costo por transacción'],
  fabric: ['Observatorio del lago OneLake', 'Tomar decisiones con datos compartidos', 'El lago representa datos conectados; Fabric los prepara y Power BI los convierte en información para decidir.', 'Calidad del dato y tiempo para obtener un indicador'],
  m365: ['Barrio de oficinas y colaboración', 'Conectar personas, documentos y trabajo', 'Teams, Outlook, SharePoint y las aplicaciones de Microsoft 365 son las oficinas de la ciudad.', 'Adopción, colaboración y tiempo de ciclo'],
  copilot: ['Torre de asistentes del trabajo', 'Ayudar a las personas en su trabajo diario', 'Microsoft 365 Copilot ayuda a preparar, resumir y crear sobre información a la que el usuario tiene acceso.', 'Uso efectivo, calidad y tiempo ahorrado validado'],
  copilotStudio: ['Taller de agentes', 'Automatizar atención y tareas conectadas', 'Copilot Studio permite construir agentes con instrucciones, herramientas y conexiones al negocio.', 'Resolución de solicitudes y escalaciones humanas'],
  dynamics: ['Fábrica y centro de operaciones', 'Conectar ventas, clientes, finanzas y suministro', 'Dynamics 365 representa los procesos ERP y CRM que convierten demanda en entregas y servicio.', 'Tiempo de pedido, inventario y satisfacción del cliente'],
  power: ['Taller de automatización', 'Mejorar procesos sin desarrollar todo desde cero', 'Power Apps y Power Automate conectan aplicaciones y flujos; Dataverse organiza sus datos.', 'Tiempo de proceso, errores y adopción'],
  entra: ['Puerta de identidad', 'Controlar quién accede a cada recurso', 'Entra verifica identidades y aplica políticas de acceso. La puerta representa acceso continuo, no una muralla infalible.', 'Cobertura MFA y revisión de privilegios'],
  defender: ['Cuartel de protección', 'Reducir exposición y responder a amenazas', 'Defender protege y correlaciona señales de equipos, identidades, correo y cargas cloud.', 'Cobertura de protección y tiempo de respuesta'],
  sentinel: ['Centro de vigilancia de la ciudad', 'Investigar señales de todo el entorno', 'Sentinel centraliza registros y ayuda a investigar incidentes y orquestar respuestas.', 'Tiempo de detección y resolución de incidentes'],
  purview: ['Archivo y gobierno de información', 'Saber qué datos existen y cómo protegerlos', 'Purview representa clasificación, gobierno, protección y cumplimiento de la información.', 'Datos clasificados y cobertura de políticas'],
  secCopilot: ['Laboratorio del equipo de seguridad', 'Asistir al analista de seguridad', 'Security Copilot ayuda a investigar y explicar señales; las decisiones conservan supervisión humana.', 'Tiempo de investigación y calidad del análisis'],
  ea: ['Casa de contratación empresarial', 'Planificar la contratación corporativa', 'EA representa un marco de compra. No es una aplicación y su conveniencia depende de elegibilidad y condiciones.', 'Cobertura de licencias y calendario de renovación'],
  mcae: ['Centro de contratación digital', 'Organizar compras y facturación cloud', 'MCA-E representa un marco comercial, con responsabilidades y facturación que deben revisarse para cada cliente.', 'Asignación de costos y trazabilidad de compras'],
  csp: ['Comercio y servicios del partner', 'Adoptar servicios con acompañamiento', 'El canal CSP conecta suscripciones con servicios de gestión y soporte del partner.', 'Nivel de servicio y costo total contratado'],
  macc: ['Centro de planificación FinOps', 'Alinear el consumo con el compromiso', 'MACC es un compromiso de consumo; no es por sí mismo un descuento. Se evalúa junto con demanda y optimización.', 'Consumo elegible, previsión y costo por unidad'],
  hq: ['Centro de bienvenida y estrategia', 'Diseñar una hoja de ruta de transformación', 'El equipo de cuenta y los arquitectos conectan prioridades de negocio con capacidades y adopción.', 'Hitos de adopción y resultados de pilotos'],
  lsp: ['Oficina de gestión de licencias', 'Ordenar contratos y renovaciones', 'El partner de licenciamiento ayuda a operar compras e inventarios según el acuerdo aplicable.', 'Licencias utilizadas y renovaciones previstas'],
  gsi: ['Obra de modernización', 'Llevar la transformación a producción', 'El integrador representa migración, integración, despliegue y gestión del cambio.', 'Cargas migradas, continuidad y adopción'],
};
export const EXECUTIVE_ROUTES = [
  { name: 'Productividad y talento', ids: ['m365','copilot','entra'], decision: 'Elegir un equipo piloto, revisar permisos y medir adopción antes de ampliar.' },
  { name: 'Modernizar con Azure', ids: ['compute','azuredata','gsi'], decision: 'Priorizar una carga, definir continuidad y comparar su costo total actual y futuro.' },
  { name: 'Decidir con datos e IA', ids: ['fabric','azuredata','purview','copilotStudio'], decision: 'Elegir un caso de negocio, sus fuentes de datos y un responsable de calidad.' },
  { name: 'Ventas y operaciones', ids: ['dynamics','power','fabric'], decision: 'Mapear un proceso completo y medir demoras, errores y experiencia del cliente.' },
  { name: 'Seguridad y confianza', ids: ['entra','defender','sentinel','secCopilot','purview'], decision: 'Acordar riesgos prioritarios, responsabilidades y un plan de respuesta.' },
  { name: 'Inversión y adopción', ids: ['hq','ea','mcae','csp','macc','lsp','gsi'], decision: 'Comparar alternativas comerciales, consumo esperado y servicios de implementación. No es necesario contratar todas.' },
];
export function initExecutiveTour(select) {
  const panel = document.getElementById('executive-panel');
  let route = null, step = 0;
  function show() {
    panel.hidden = false; document.body.classList.add('executive-tour');
    if (!route) {
      select(null,null);
      panel.innerHTML = `<div class="exec-heading"><span>SU EMPRESA EN ESTA CIUDAD</span><button id="exec-close" aria-label="Cerrar recorrido">✕</button></div><h2>¿Qué quiere transformar?</h2><p>Elija un objetivo. Visitaremos los edificios LEGO que lo hacen posible.</p><div class="exec-options">${EXECUTIVE_ROUTES.map((r,i)=>`<button data-route="${i}">${r.name}<span>→</span></button>`).join('')}</div><small>Mapa conceptual del portafolio. Cada solución requiere diseño, configuración y adopción.</small>`;
      panel.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=EXECUTIVE_ROUTES[Number(b.dataset.route)];step=0;show();});
    } else {
      const id=route.ids[step], [place,outcome,meaning,metric]=CITY_STORIES[id];
      select('district',id);
      panel.innerHTML=`<div class="exec-heading"><span>${route.name} · ${step+1}/${route.ids.length}</span><button id="exec-close" aria-label="Cerrar recorrido">✕</button></div><h2>${outcome}</h2><b>${place}</b><p>${meaning}</p><small>QUÉ MEDIR</small><p>${metric}</p>${step===route.ids.length-1?`<small>SIGUIENTE DECISIÓN</small><p>${route.decision}</p>`:''}<div class="exec-actions"><button id="exec-back">${step?'Anterior':'Objetivos'}</button><button id="exec-next" class="btn">${step===route.ids.length-1?'Elegir otro objetivo':'Siguiente edificio →'}</button></div>`;
      panel.querySelector('#exec-back').onclick=()=>{if(step)step--;else route=null;show();};
      panel.querySelector('#exec-next').onclick=()=>{if(step<route.ids.length-1)step++;else route=null;show();};
    }
    panel.querySelector('#exec-close').onclick=()=>{panel.hidden=true;document.body.classList.remove('executive-tour');select(null,null);document.getElementById('executive-start').focus();};
  }
  document.getElementById('executive-start').onclick=()=>{route=null;step=0;show();};
  document.getElementById('guide-executive').onclick=()=>{route=null;step=0;show();};
}
