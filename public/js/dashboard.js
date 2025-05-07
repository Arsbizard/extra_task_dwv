// public/js/dashboard.js
(async function(){
  console.log("🚀 dashboard.js loaded");

  // 1) Загружаем все вакансии
  const raw = await fetch('/data/jobs.json').then(r=>r.json());
  console.log("🔢 Loaded raw jobs:", raw.length);

  // 2) Default даты
  const dfIn = document.getElementById('dash-date-from');
  const dtIn = document.getElementById('dash-date-to');
  const allDates = raw.map(j=>j.date).sort();
  dfIn.value = allDates[0];
  dtIn.value = allDates[allDates.length-1];

  // 3) Заполнить селект локаций
  const selLoc = document.getElementById('dash-location');
  [...new Set(raw.map(j=>j.location))].sort()
    .forEach(l => selLoc.insertAdjacentHTML('beforeend',
      `<option value="${l}">${l}</option>`
    ));

  // 4) Будем хранить текущий отфильтрованный массив
  let jobs = raw.slice();

  // 5) Tooltip
  const tt = d3.select('body').append('div')
    .attr('class','chart-tooltip')
    .style('opacity',0);

  // 6) Цветовая шкала
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // 7) Стоп-слова, которые не хотим показывать в word-chart
  const stopwords = new Set([
    'and','with','the','for','from','that','this','will','you',
    'your','are','all','etc','use','uses','using'
  ]);

  // 8) Обновить все агрегированные данные
  let chartData = {};
  function updateChartData(){
    // Skills → split to words, filter stopwords
    const words = jobs
      .flatMap(j=>j.summary)
      .flatMap(s=>s.split(/\W+/))
      .map(w=>w.toLowerCase())
      .filter(w=>w.length>2 && !stopwords.has(w));
    chartData.skills    = aggregate(words);

    // Companies
    chartData.companies = aggregate(jobs.map(j=>j.company || 'Unknown'));

    // Locations
    chartData.locations = aggregate(jobs.map(j=>j.location || 'Unknown'));

    // Timeline
    chartData.timeline  = aggregate(jobs.map(j=>j.date))
      .map(d=>({ date: new Date(d.key), count: d.val }))
      .sort((a,b)=>a.date - b.date);
  }
  updateChartData();

  // 9) Helpers
  function aggregate(arr){
    return Object.entries(
      arr.reduce((m,v)=>{
        m[v] = (m[v]||0) + 1; return m;
      },{})
    )
    .sort((a,b)=>b[1]-a[1])
    .map(([k,v])=>({ key:k, val:v }));
  }
  function dims(sel){
    const el = document.querySelector(sel);
    return { w: el.clientWidth, h: el.clientHeight };
  }

  // 10) Функции рендера каждого чарта
  function renderSkills(){
    const sel = '#skills-chart', topN = 15;
    const data = chartData.skills.slice(0, topN);
    renderBar(sel, data);
  }
  function renderCompanies(){
    const sel = '#companies-chart', topN = 10;
    const data = chartData.companies.slice(0, topN);
    renderPie(sel, data);
  }
  function renderLocations(){
    const sel = '#locations-chart', topN = 10;
    const data = chartData.locations.slice(0, topN);
    renderBar(sel, data);
  }
  function renderTimeline(){
    const sel = '#timeline-chart';
    const data = chartData.timeline;
    renderLine(sel, data);
  }

  // 11) Рендерим Skills сразу
  renderSkills();

  // 12) Переключение табов → рендер нужного чарта
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(btn=>{
    btn.addEventListener('shown.bs.tab', e=>{
      const target = e.target.getAttribute('data-bs-target');
      switch(target){
        case '#companies': renderCompanies(); break;
        case '#locations': renderLocations(); break;
        case '#timeline':  renderTimeline();  break;
      }
    });
  });

  // 13) Apply Filters → обновляем jobs, data и перерисовываем текущий таб
  document.getElementById('dash-apply').addEventListener('click', ()=>{
    const byLoc = selLoc.value, df = dfIn.value, dt = dtIn.value;
    console.log("📋 Applying filters:", {byLoc, df, dt});
    jobs = raw.filter(j =>
      (!byLoc || j.location === byLoc) &&
      (!df    || j.date     >= df) &&
      (!dt    || j.date     <= dt)
    );
    updateChartData();
    // какого таба активен?
    const activeTab = document.querySelector('.nav-link.active').getAttribute('data-bs-target');
    switch(activeTab){
      case '#skills':   renderSkills();   break;
      case '#companies':renderCompanies();break;
      case '#locations':renderLocations();break;
      case '#timeline': renderTimeline(); break;
    }
  });

  // 14) Реализация D3-функций
  function renderBar(sel, data){
    const { w,h } = dims(sel),
          m = {top:20, right:20, bottom:80, left:60},
          W = w - m.left - m.right,
          H = h - m.top - m.bottom;

    d3.select(sel).selectAll('*').remove();
    const svg = d3.select(sel)
      .append('svg').attr('width',w).attr('height',h)
      .append('g').attr('transform',`translate(${m.left},${m.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d=>d.key)).range([0,W]).padding(.2);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data,d=>d.val)]).nice().range([H,0]);

    svg.append('g')
      .attr('transform',`translate(0,${H})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform','rotate(-45)')
        .style('text-anchor','end');

    svg.append('g').call(d3.axisLeft(y));

    svg.selectAll('rect').data(data).enter().append('rect')
      .attr('x', d=>x(d.key))
      .attr('y', H)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', (_,i)=>color(i))
      .transition().duration(800)
        .attr('y', d=>y(d.val))
        .attr('height', d=>Math.max(0, H - y(d.val)));

    svg.selectAll('rect')
      .on('mouseover',(ev,d)=>{
        tt.transition().duration(200).style('opacity',0.9);
        tt.html(`${d.key}: ${d.val}`);
        tt.style('left',ev.pageX+5+'px').style('top',ev.pageY-25+'px');
      })
      .on('mouseout',()=>tt.transition().duration(200).style('opacity',0));
  }

  function renderPie(sel, data){
    // убрали "рамку" контейнера в CSS, сейчас просто рисуем
    const { w,h } = dims(sel),
          // уменьшили маржин
          r = Math.min(w,h)/2 - 30;

    d3.select(sel).selectAll('*').remove();
    const svg = d3.select(sel)
      .append('svg').attr('width',w).attr('height',h)
      .append('g').attr('transform',`translate(${w/2},${h/2})`);

    const pie = d3.pie().value(d=>d.val),
          arc = d3.arc().innerRadius(0).outerRadius(r);

    const arcs = svg.selectAll().data(pie(data)).enter().append('g');
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (_,i)=>color(i))
      .on('mouseover',(ev,d)=>{
        tt.transition().duration(200).style('opacity',0.9);
        tt.html(`${d.data.key}: ${d.data.val}`);
        tt.style('left',ev.pageX+5+'px').style('top',ev.pageY-25+'px');
      })
      .on('mouseout',()=>tt.transition().duration(200).style('opacity',0));

    arcs.append('text')
      .attr('transform',d=>`translate(${arc.centroid(d)})`)
      .attr('text-anchor','middle').style('font-size','10px')
      .text(d=>d.data.key);
  }

  function renderLine(sel, data){
    const { w,h } = dims(sel),
          m = {top:20, right:20, bottom:100, left:60},
          W = w - m.left - m.right,
          H = h - m.top - m.bottom;

    d3.select(sel).selectAll('*').remove();
    const svg = d3.select(sel)
      .append('svg').attr('width',w).attr('height',h)
      .append('g').attr('transform',`translate(${m.left},${m.top})`);

    const x = d3.scaleTime().domain(d3.extent(data,d=>d.date)).range([0,W]),
          y = d3.scaleLinear().domain([0,d3.max(data,d=>d.count)]).nice().range([H,0]);

    svg.append('g')
      .attr('transform',`translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(6))
      .selectAll('text')
        .attr('transform','rotate(-45)')
        .style('text-anchor','end');

    svg.append('g').call(d3.axisLeft(y));

    const line = d3.line().x(d=>x(d.date)).y(d=>y(d.count));
    svg.append('path').datum(data)
      .attr('fill','none').attr('stroke',color(0)).attr('stroke-width',2)
      .attr('d',line);

    svg.selectAll('circle').data(data).enter().append('circle')
      .attr('cx',d=>x(d.date)).attr('cy',d=>y(d.count)).attr('r',4).attr('fill',color(0))
      .on('mouseover',(ev,d)=>{
        tt.transition().duration(200).style('opacity',0.9);
        tt.html(`${d.date.toLocaleDateString()}: ${d.count}`);
        tt.style('left',ev.pageX+5+'px').style('top',ev.pageY-25+'px');
      })
      .on('mouseout',()=>tt.transition().duration(200).style('opacity',0));
  }

})();
