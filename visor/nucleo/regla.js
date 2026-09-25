'use strict';
/* ══════════════════════════════════════════════════════════════════
   NÚCLEO — REGLA DE MEDICIÓN (la de RutaCore, disponible en todos los módulos)
   Mientras está activa, una capa transparente toma los clics para que
   ningún módulo reciba clics por accidente.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  const map = UC.mapa.map;
  let activa = false, pts = [], lineas = [], marcas = [], marcaTotal = null, totalM = 0;
  const fmt = m => m >= 1000 ? (m / 1000).toFixed(2) + ' km' : m.toFixed(0) + ' m';

  function limpiar(){
    lineas.forEach(l => map.removeLayer(l)); lineas = [];
    marcas.forEach(m => map.removeLayer(m)); marcas = [];
    if(marcaTotal){ map.removeLayer(marcaTotal); marcaTotal = null; }
    pts = []; totalM = 0;
    UC.el('ruler-total-display').classList.remove('show');
  }
  function encender(){
    activa = true;
    UC.interaccion.limpiar();
    UC.el('btn-ruler').classList.add('mode-active');
    UC.el('ruler-overlay').classList.add('show');
    UC.el('ruler-banner').classList.add('show');
    UC.el('instruction').style.display = 'none';
  }
  function apagar(){
    activa = false;
    UC.el('ruler-overlay').classList.remove('show'); UC.el('ruler-banner').classList.remove('show');
    UC.el('btn-ruler').classList.remove('mode-active');
    UC.el('instruction').style.display = '';
    limpiar();
  }
  UC.el('btn-ruler').addEventListener('click', () => { if(!UC.red.cargada()) return; activa ? apagar() : encender(); });
  UC.el('ruler-clear-btn').addEventListener('click', limpiar);
  UC.el('ruler-overlay').addEventListener('click', e => {
    if(!activa) return;
    const rect = UC.el('map').getBoundingClientRect();
    const p = map.containerPointToLatLng(L.point(e.clientX - rect.left, e.clientY - rect.top));
    const ll = [p.lat, p.lng];
    if(pts.length){
      const prev = pts[pts.length - 1];
      const d = UC.util.haversineKm(prev, ll) * 1000;
      totalM += d;
      lineas.push(L.polyline([prev, ll], { color:'#1c1c1e', weight:2, dashArray:'5 4', interactive:false }).addTo(map));
      const mid = [(prev[0] + ll[0]) / 2, (prev[1] + ll[1]) / 2];
      const lbl = L.circleMarker(mid, { radius:0, opacity:0, fillOpacity:0, interactive:false }).addTo(map)
        .bindTooltip(fmt(d), { permanent:true, className:'ruler-tooltip', direction:'top', offset:[0, -4] });
      lbl.openTooltip(); marcas.push(lbl);
      if(marcaTotal) map.removeLayer(marcaTotal);
      marcaTotal = L.circleMarker(ll, { radius:0, opacity:0, fillOpacity:0, interactive:false }).addTo(map)
        .bindTooltip(`Total: ${fmt(totalM)}`, { permanent:true, className:'ruler-tooltip ruler-total-tip', direction:'top', offset:[0, -4] });
      marcaTotal.openTooltip();
      UC.el('ruler-dist').textContent = fmt(totalM);
      UC.el('ruler-total-display').classList.add('show');
    }
    marcas.push(L.circleMarker(ll, { radius:4, color:'#1c1c1e', fillColor:'#fff', fillOpacity:1, weight:2, interactive:false }).addTo(map));
    pts.push(ll);
  });

  UC.regla = { activa:() => activa, apagar };
})();
