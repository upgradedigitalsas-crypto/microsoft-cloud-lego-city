// Pure arithmetic shared by the live controls and the printable snapshot.
export function optimization({ gross, ri, ahb, macc }) {
  const discount = Math.min(0.75, ri * 0.7 + (ahb ? 0.18 : 0));
  const net = gross * (1 - discount);
  return { gross, net, saving: gross - net, discount, macc };
}
export function bundle({ seats, current, e5 }) {
  return { gross: seats * current, net: seats * e5, saving: seats * (current - e5) };
}
export function printProposal({ client, title, rows }) {
  document.getElementById('proposal-print')?.remove();
  const card = document.createElement('article');
  card.id = 'proposal-print';
  const add = (tag, text) => { const node = document.createElement(tag); node.textContent = text; card.append(node); };
  add('small', 'CloudCity · Microsoft Cloud · Escenario corporativo');
  add('h1', title);
  add('h2', client.trim() || 'Cliente corporativo');
  add('p', new Date().toLocaleDateString('es-CO'));
  for (const [label, value] of rows) add('p', `${label}: ${value}`);
  add('p', 'Estimación ilustrativa en USD. Precios y elegibilidad sujetos a validación comercial. El compromiso MACC no se suma como ahorro automático.');
  document.body.append(card);
  window.print();
}
