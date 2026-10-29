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
      [5,'엘 보른 · 카페 미정',41.3835,2.1824],
      [6,'모코 뮤지엄 (선택)',41.3847,2.1811]]},
    {day:15,color:'#b4233c',stops:[
      [0,'사그라다 파밀리아',41.4036,2.1744],
      [2,'카사 바트요',41.3916,2.1649],
      [3,'그라시아 거리 · 쇼핑 구역',41.3933,2.1632]]},
    {day:16,color:'#0f7b6c',stops:[
      [0,'카사 비센스',41.4035,2.1506],
      [1,'그라시아 동네 · 빌라 광장 부근',41.4006,2.1576],
      [2,'구엘 공원',41.4145,2.1527],
      [4,'벙커 델 카르멜',41.4193,2.1619]]},
    {day:26,color:'#7b3fa0',stops:[
      [2,'포르탈 델 앙헬 · 쇼핑 구역',41.3868,2.1735],
      [2,'엘 코르테 잉글레스 · 카탈루냐 광장',41.3879,2.1706],
      [3,'카사 밀라',41.3954,2.1619]]}
  ];
  const dates=document.getElementById('bcn-map-dates');
  const list=document.getElementById('bcn-map-stops');
  const reset=document.getElementById('bcn-map-reset');
  let map,layer;
  let current=routes[0];
  let overview=true;
  const cityPoints=routes.flatMap(r=>r.stops.map(s=>s.slice(2)));
  const timeFor=(route,stop)=>PLAN.find(p=>p.d===route.day).plan[stop[0]][0];
  const googleURL=stop=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(stop[2]+','+stop[3]);
  function cityView(){if(host.clientWidth)map.fitBounds(cityPoints,{padding:[28,28],maxZoom:14,animate:false});}
  function dayView(){if(host.clientWidth)map.fitBounds(current.stops.map(s=>s.slice(2)),{padding:[35,35],maxZoom:15,animate:false});}
  function show(route,fit=true){
    current=route;
    dates.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.day)===route.day));
    list.style.setProperty('--route-color',route.color);
    list.replaceChildren();
    if(layer)layer.clearLayers();
    route.stops.forEach((stop,i)=>{
      const time=timeFor(route,stop);
      const li=document.createElement('li');
      const button=document.createElement('button');button.type='button';
      const number=document.createElement('span');number.className='bcn-map-number';number.textContent=i+1;
      const label=document.createElement('span');
      const clock=document.createElement('time');clock.textContent=time;
      label.append(clock,stop[1]);button.append(number,label);li.append(button);list.append(li);
      if(!map){button.disabled=true;return;}
      const popup=document.createElement('div');
      const title=document.createElement('b');title.textContent=(i+1)+'. '+stop[1];
      const detail=document.createElement('div');detail.textContent='1/'+route.day+' · '+time;
      const link=document.createElement('a');link.href=googleURL(stop);link.target='_blank';link.rel='noopener';link.textContent='Google 지도에서 보기';
      popup.append(title,detail,link);
      const marker=L.marker(stop.slice(2),{
        title:(i+1)+'. '+stop[1],
        icon:L.divIcon({className:'bcn-map-marker',html:'<span class="bcn-map-pin" style="--route-color:'+route.color+'">'+(i+1)+'</span>',iconSize:[30,30],iconAnchor:[15,15]})
      }).addTo(layer).bindPopup(popup);
      button.addEventListener('click',()=>{map.setView(stop.slice(2),Math.max(map.getZoom(),16));marker.openPopup();});
    });
    if(map){
      L.polyline(route.stops.map(s=>s.slice(2)),{color:route.color,weight:4,opacity:.85,dashArray:'7 9',interactive:false}).addTo(layer);
      if(fit){overview=false;dayView();}
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
    reset.addEventListener('click',()=>{overview=true;cityView();});
    // Restore the map size after a city filter hides and then shows Barcelona.
    new ResizeObserver(()=>{if(host.clientWidth){map.invalidateSize();if(overview)cityView();else dayView();}}).observe(host);
  }else{
    host.textContent='지도를 불러오지 못했어요. 새로고침해 주세요.';
    reset.disabled=true;
  }
  show(current,false);
  if(map)cityView();
})();
