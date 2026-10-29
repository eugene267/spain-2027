// Coordinates mark sights or representative points of neighbourhoods, not booked cafés.
// The plan index supplies the current time directly from the itinerary in index.html.
(()=>{
  const host=document.getElementById('bcn-map');
  if(!host)return;
  const routes=[
    {day:14,color:'#1d5faf',stops:[
      [1,'고딕 지구 · 대성당',41.3839,2.1762],
      [2,'카탈루냐 음악당',41.3876,2.1753],
      [4,'피카소 미술관',41.3852,2.1809],
      [5,'엘 보른',41.3835,2.1824],
      [6,'모코 뮤지엄 (선택)',41.3847,2.1811]]},
    {day:15,color:'#b4233c',stops:[
      [0,'사그라다 파밀리아',41.4036,2.1744],
      [2,'카사 바트요',41.3916,2.1649],
      [3,'그라시아 거리',41.3933,2.1632]]},
    {day:16,color:'#0f7b6c',stops:[
      [0,'카사 비센스',41.4035,2.1506],
      [1,'그라시아 동네',41.4006,2.1576],
      [2,'구엘 공원',41.4145,2.1527],
      [4,'벙커 델 카르멜',41.4193,2.1619]]},
    {day:26,color:'#7b3fa0',stops:[
      [2,'포르탈 델 앙헬',41.3868,2.1735],
      [2,'엘 코르테 잉글레스',41.3879,2.1706],
      [3,'카사 밀라',41.3954,2.1619]]}
  ];
  const dates=document.getElementById('bcn-map-dates');
  const reset=document.getElementById('bcn-map-reset');
  let map,layer,cityBounds;
  let current=null;
  const timeFor=(route,stop)=>PLAN.find(p=>p.d===route.day).plan[stop[0]][0];
  const googleURL=stop=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(stop[2]+','+stop[3]);
  function moveTo(bounds,maxZoom,animate=false){
    if(!map||!host.clientWidth)return;
    map.stop();
    const options={padding:[45,45],maxZoom,duration:.9};
    if(animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)map.flyToBounds(bounds,options);
    else map.fitBounds(bounds,{...options,animate:false});
  }
  function updateDates(){dates.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.day)===current?.day));}
  function showOverview(animate=false){
    current=null;updateDates();
    if(!map)return;
    layer.clearLayers();
    // Larger regions go underneath smaller ones so overlapping days remain selectable.
    [...routes].sort((a,b)=>b.radius-a.radius).forEach(route=>{
      L.circle(route.center,{radius:route.radius,color:route.color,weight:2,fillOpacity:.12})
        .addTo(layer).on('click',()=>show(route));
    });
    routes.forEach(route=>{
      const label=document.createElement('span');label.className='bcn-map-area-label';
      label.style.setProperty('--route-color',route.color);label.textContent='1/'+route.day;
      L.marker(route.center,{title:'1/'+route.day+' 동선 확대',
        icon:L.divIcon({className:'bcn-map-area-marker',html:label,iconSize:[60,28],iconAnchor:[30,14]})
      }).addTo(layer).on('click',()=>show(route));
    });
    moveTo(cityBounds,14,animate);
  }
  function show(route){
    current=route;
    updateDates();
    if(layer)layer.clearLayers();
    route.stops.forEach((stop,i)=>{
      const time=timeFor(route,stop);
      if(!map)return;
      const pin=document.createElement('div');pin.className='bcn-map-pin';
      pin.style.setProperty('--route-color',route.color);
      const label=document.createElement('span');label.className='bcn-map-label';label.textContent=stop[1];
      // Place neighbouring labels on opposite sides of their points.
      const leftLabels={14:[0,4],15:[1],16:[0,2],26:[1]};
      if(leftLabels[route.day].includes(i))label.classList.add('label-left');
      if(route.day===14&&(i===0||i===3))label.classList.add('label-below');
      pin.append(label);
      const popup=document.createElement('div');
      const title=document.createElement('b');title.textContent=stop[1];
      const detail=document.createElement('div');detail.textContent='1/'+route.day+' · '+time;
      const activity=document.createElement('div');activity.textContent=PLAN.find(p=>p.d===route.day).plan[stop[0]][1];
      const link=document.createElement('a');link.href=googleURL(stop);link.target='_blank';link.rel='noopener';link.textContent='Google 지도에서 보기';
      popup.append(title,detail,activity,link);
      L.marker(stop.slice(2),{
        title:stop[1],
        icon:L.divIcon({className:'bcn-map-marker',html:pin,iconSize:[12,12],iconAnchor:[6,6]})
      }).addTo(layer).bindPopup(popup);
    });
    if(map){
      L.polyline(route.stops.map(s=>s.slice(2)),{color:route.color,weight:4,opacity:.85,dashArray:'7 9',interactive:false}).addTo(layer);
      moveTo(route.stops.map(s=>s.slice(2)),15,true);
    }
  }
  routes.forEach(route=>{
    const button=document.createElement('button');button.type='button';button.dataset.day=route.day;
    button.style.setProperty('--route-color',route.color);button.textContent='1/'+route.day;
    button.addEventListener('click',()=>show(route));dates.append(button);
  });
  if(window.L){
    map=L.map(host,{scrollWheelZoom:false,minZoom:12,maxZoom:18,maxBounds:[[41.32,2.05],[41.47,2.24]],maxBoundsViscosity:1});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    layer=L.layerGroup().addTo(map);
    cityBounds=L.latLngBounds([]);
    routes.forEach(route=>{
      const points=route.stops.map(s=>L.latLng(s.slice(2)));
      route.center=L.latLng(points.reduce((s,p)=>s+p.lat,0)/points.length,points.reduce((s,p)=>s+p.lng,0)/points.length);
      route.radius=Math.max(...points.map(p=>route.center.distanceTo(p)))+120;
      cityBounds.extend(L.circle(route.center,{radius:route.radius}).getBounds());
    });
    reset.addEventListener('click',()=>showOverview(true));
    // Restore the map size after a city filter hides and then shows Barcelona.
    new ResizeObserver(()=>{if(host.clientWidth){map.invalidateSize();moveTo(current?current.stops.map(s=>s.slice(2)):cityBounds,current?15:14);}}).observe(host);
  }else{
    host.textContent='지도를 불러오지 못했어요. 새로고침해 주세요.';
    reset.disabled=true;
  }
  showOverview();
  // Measure the settled layout before applying the same view as the reset button.
  if(map)requestAnimationFrame(()=>{map.invalidateSize();moveTo(current?current.stops.map(s=>s.slice(2)):cityBounds,current?15:14);});
})();
