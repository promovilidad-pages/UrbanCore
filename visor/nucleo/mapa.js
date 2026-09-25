'use strict';
/* ══════════════════════════════════════════════════════════════════
   NÚCLEO — MAPA: fondos, orden de capas (panes) y lienzos
   ══════════════════════════════════════════════════════════════════ */
(function(){
  /* Mismos 4 fondos que las apps: CARTO exige API key y tile.openstreetmap.org
     bloquea a las apps, por eso Claro/Oscuro/Satélite van con ArcGIS y OSM con MapTiler. */
  const MAPTILER_KEY = '1bn01ccw92pBVsN2xVIz';
  const TILES = {
    claro:{ urls:['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'],
            maxNativeZoom:16, attribution:'© OpenStreetMap contributors, © Esri' },
    oscuro:{ urls:['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                   'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'],
             maxNativeZoom:16, attribution:'© OpenStreetMap contributors, © Esri' },
    satelite:{ urls:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
               maxNativeZoom:19, attribution:'© OpenStreetMap contributors, © Esri' },
    osm:{ urls:[`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`],
          maxNativeZoom:20, attribution:'© OpenStreetMap contributors, © MapTiler' }
  };

  const map = L.map('map', { zoomControl:false, preferCanvas:true, boxZoom:false }).setView([-9.19, -75.015], 6);

  let baseTileLayers = [], basemapActual = 'claro';
  function setBasemap(k){
    const cfg = TILES[k];
    baseTileLayers.forEach(l => map.removeLayer(l));
    baseTileLayers = cfg.urls.map((url, i) => L.tileLayer(url, { maxZoom:20, maxNativeZoom:cfg.maxNativeZoom, attribution:i === 0 ? cfg.attribution : undefined }).addTo(map));
    ['claro','oscuro','satelite','osm'].forEach(j => UC.el('bm-' + j).classList.toggle('active', j === k));
    basemapActual = k;
    UC.eventos.emit('mapa:fondo', k);
  }
  setBasemap('claro');
  ['claro','oscuro','satelite','osm'].forEach(k => UC.el('bm-' + k).addEventListener('click', () => setBasemap(k)));

  /* Orden de capas (de abajo hacia arriba). La red base va en overlayPane (400).
     Cada módulo dibuja en su propio pane, así nunca se tapan de forma inesperada. */
  const PANES = [
    ['corredorPane', 395],  // Cobertura: corredores del proyecto (debajo de la red)
    ['jerPane', 402],       // Jerarquía: vías principales clasificadas
    ['denPane', 405],       // Análisis: densidad
    ['selPane', 410],       // selecciones y resaltados de búsqueda
    ['rutasPane', 420],     // rutas
    ['overlapPane', 425],   // Cobertura: superposición
    ['hoverPane', 430],     // resaltado bajo el mouse
    ['editPane', 440]       // edición de red (tramo en dibujo)
  ];
  PANES.forEach(([n, z]) => { map.createPane(n); map.getPane(n).style.zIndex = z; map.getPane(n).style.pointerEvents = 'none'; });

  /* Lienzo optimizado (lo que resolvimos en RutaCore):
     ninguna línea es interactiva — clic y hover van por el índice espacial del núcleo —
     pero el canvas de Leaflet igual recorre todas sus líneas en cada movimiento del mouse.
     Se desactiva esa búsqueda y se reenvían los eventos al mapa.
     Cada capa crea su lienzo UNA vez y lo reutiliza (no se acumulan lienzos → sin "Aw, Snap"). */
  function lienzo(pane){
    const r = L.canvas(Object.assign({ padding:0.5 }, pane ? { pane } : {}));
    r._handleMouseHover = function(e){ this._fireEvent(false, e); };
    r._onClick = function(e){ this._fireEvent(false, e); };
    return r;
  }

  UC.mapa = { map, setBasemap, lienzo, fondo:() => basemapActual };
})();
