/* =========================================================
   MAGIC POWDER — Quiz flow & formula engine
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const form = $('#quizForm');
  const steps = $$('.q-step');
  const TOTAL = steps.length;
  let current = 1;

  const LABELS = {
    goal: { diet: '체지방 감량', bulk: '근육량 증가', recovery: '회복 · 지구력', meal: '식사 대용' },
    goalEn: { diet: 'CUT', bulk: 'LEAN MASS', recovery: 'ENDURANCE', meal: 'DAILY MEAL' },
    sport: { weight: 'Weight', pilates: 'Pilates/Yoga', run: 'Run/Cycle', crossfit: 'CrossFit' },
    sportKr: { weight: '웨이트', pilates: '필라테스/요가', run: '러닝/사이클', crossfit: '크로스핏/구기' },
    flavor: { choco: '더블 초콜릿', misu: '고소한 미숫가루', matcha: '제주 말차', plain: '클린 무맛' },
    flavorEn: { choco: 'DOUBLE CHOCO', misu: 'MISUGARU', matcha: 'MATCHA', plain: 'UNFLAVORED' },
  };

  /* ---------- Read answers ---------- */
  const answers = () => {
    const fd = new FormData(form);
    return {
      sex: fd.get('sex'), age: fd.get('age'),
      height: parseFloat(fd.get('height')), weight: parseFloat(fd.get('weight')),
      sport: fd.get('sport'), freq: fd.get('freq'), dur: fd.get('dur'),
      goal: fd.get('goal'),
      lactose: fd.get('lactose'), caffeine: fd.get('caffeine'), allergy: fd.getAll('allergy'),
      flavor: fd.get('flavor'),
      label: (fd.get('label') || '').trim().toUpperCase(),
    };
  };

  /* ---------- Formula engine ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const proteinBase = (a) => (a.lactose === '2' ? 'plant' : a.lactose === '1' ? 'wpi' : 'blend');
  const BASE_NAME = { plant: '완두 · 쌀 식물성 분리단백', wpi: 'WPI 분리유청단백', blend: 'WPI + WPC 블렌드' };
  const BASE_SHORT = { plant: 'Plant', wpi: 'WPI', blend: 'WPI+WPC' };

  const compute = (a) => {
    const w = a.weight;
    const freqMul = { 1: 0.95, 2: 1, 3: 1.1 }[a.freq];
    const pPerKg = { diet: 0.4, bulk: 0.48, recovery: 0.36, meal: 0.32 }[a.goal];
    const p = Math.round(clamp(w * pPerKg * freqMul, 18, 45));
    let c = { diet: 4, bulk: 26, recovery: 22, meal: 24 }[a.goal];
    if (a.sport === 'run') c += 8;
    if (a.dur === '3' && a.goal !== 'diet') c += 4;
    let bcaa = { diet: 5000, bulk: 6000, recovery: 7000, meal: 3000 }[a.goal];
    if (a.freq === '3') bcaa += 1000;
    let elec = 200;
    if (a.sport === 'run' || a.sport === 'crossfit') elec += 400;
    if (a.dur === '3') elec += 200;
    if (a.goal === 'recovery') elec += 100;
    const enz = { 0: 100, 1: 150, 2: 250 }[a.lactose];
    const caf = a.caffeine === '1' ? 0 : { diet: 120, recovery: 60, bulk: 0, meal: 0 }[a.goal];
    const creatine = a.goal === 'bulk' ? 5000 : a.sport === 'crossfit' || a.sport === 'weight' ? 3000 : 0;
    const fiber = a.goal === 'meal' ? 5 : a.goal === 'diet' ? 3 : 1;
    const kcal = p * 4 + c * 4 + fiber * 2 + 6;
    const scoop = Math.round(p / 0.82 + c + fiber + 4);
    const base = proteinBase(a);
    return { p, c, bcaa, elec, enz, caf, creatine, fiber, kcal, scoop, base };
  };

  const formulaNo = (a) => {
    const s = JSON.stringify(a);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return String(h % 10000).padStart(4, '0');
  };

  /* ---------- Steps ---------- */
  const showStep = (n) => {
    current = n;
    steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === n));
    $('#stepNow').textContent = n;
    $$('#quizDots i').forEach((d, i) => d.classList.toggle('on', i < n));
    $('#progressBar').style.width = ((n - 1) / TOTAL) * 100 + '%';
    $('#prevBtn').disabled = n === 1;
    $('#nextBtn').firstChild.textContent = n === TOTAL ? '내 포뮬러 결과 보기 ' : '다음 ';
    $('#qError').textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = (n) => {
    const a = answers();
    const need = {
      1: () => (!a.sex || !a.age ? '성별과 연령대를 선택해 주세요.'
        : !(a.height >= 120 && a.height <= 220) ? '신장을 120~220cm 사이로 입력해 주세요.'
        : !(a.weight >= 30 && a.weight <= 200) ? '체중을 30~200kg 사이로 입력해 주세요.' : ''),
      2: () => (!a.sport ? '주 운동 종목을 선택해 주세요.' : !a.freq ? '주당 운동 횟수를 선택해 주세요.' : !a.dur ? '1회 평균 운동 시간을 선택해 주세요.' : ''),
      3: () => (!a.goal ? '핵심 목표를 하나 선택해 주세요.' : ''),
      4: () => (!a.lactose ? '유제품 섭취 시 불편함 여부를 선택해 주세요.' : !a.caffeine ? '카페인 민감도를 선택해 주세요.' : !a.allergy.length ? '알레르기 항목을 선택하거나 \'없음\'을 선택해 주세요.' : ''),
      5: () => (!a.flavor ? '선호하는 맛을 선택해 주세요.' : ''),
      6: () => (!a.label ? '라벨에 새길 이름 또는 문구를 입력해 주세요.' : ''),
    }[n]();
    $('#qError').textContent = need;
    return !need;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(current)) return;
    if (current < TOTAL) showStep(current + 1);
    else runAnalysis(answers());
  });
  $('#prevBtn').addEventListener('click', () => current > 1 && showStep(current - 1));

  // auto-advance on single-choice steps
  ['goal', 'flavor'].forEach((name) => $$(`input[name="${name}"]`).forEach((r) => r.addEventListener('change', () => {
    setTimeout(() => validate(current) && showStep(current + 1), 280);
  })));

  // allergy "없음" is exclusive
  const none = $('#al-none');
  $$('input[name="allergy"]').forEach((cb) => cb.addEventListener('change', () => {
    if (cb === none && none.checked) $$('input[name="allergy"]').forEach((x) => x !== none && (x.checked = false));
    else if (cb !== none && cb.checked) none.checked = false;
  }));

  /* ---------- Live pouch preview ---------- */
  const labelInput = $('#labelInput');
  const updateLive = () => {
    const a = answers();
    $('#liveName').textContent = a.label || 'YOUR NAME';
    $('#labelCount').textContent = a.label.length;
    $('#liveGoal').textContent = a.goal ? LABELS.goalEn[a.goal] : '—';
    $('#liveSport').textContent = a.sport ? LABELS.sport[a.sport] : '—';
    $('#liveProt').textContent = a.lactose ? BASE_SHORT[proteinBase(a)] : '—';
    $('#liveFlavor').textContent = a.flavor ? LABELS.flavorEn[a.flavor] : '—';
    if (a.weight >= 30 && a.goal && a.freq && a.lactose) {
      const f = compute({ ...a, dur: a.dur || '2', caffeine: a.caffeine || '0' });
      $('#liveBase').textContent = `Protein ${f.p}g · Carbs ${f.c}g`;
    }
  };
  form.addEventListener('input', updateLive);
  form.addEventListener('change', updateLive);
  labelInput.addEventListener('input', () => {
    labelInput.value = labelInput.value.toUpperCase().replace(/\s+/g, '_');
  });
  $$('#suggest button').forEach((b) => b.addEventListener('click', () => {
    labelInput.value = b.textContent;
    updateLive();
  }));

  /* ---------- Prefill from simulator (?goal=&type=) ---------- */
  const params = new URLSearchParams(location.search);
  const check = (id) => { const el = $('#' + id); if (el) el.checked = true; };
  const goalMap = { cut: 'g-diet', lean: 'g-bulk', run: 'g-rec' };
  if (goalMap[params.get('goal')]) check(goalMap[params.get('goal')]);
  if (params.get('goal') === 'run') check('sp-r');
  if (params.get('type') === 'lactose') check('la-2');
  if (params.get('type') === 'caffeine') check('cf-1');
  if (params.get('type') === 'normal') { check('la-0'); check('cf-0'); }
  if (params.get('goal')) setTimeout(() => mpToast('시뮬레이터에서 선택한 목표와 체질이 미리 체크되었어요.'), 400);
  updateLive();

  /* ---------- Analysis → Result ---------- */
  const runAnalysis = (a) => {
    $('#quizLayout').style.display = 'none';
    $('#analyzing').classList.add('is-active');
    $('#progressBar').style.width = '100%';
    const msgs = ['12가지 건강 · 운동 변수 분석 중...', '스포츠 영양학 데이터 매칭 중...', '1g 단위 매크로 산출 중...', `${a.label} 전용 라벨 생성 중...`];
    let i = 0;
    const iv = setInterval(() => { $('#analyzingText').textContent = msgs[++i % msgs.length]; }, 550);
    setTimeout(() => {
      clearInterval(iv);
      $('#analyzing').classList.remove('is-active');
      renderResult(a);
      history.replaceState(null, '', '#r=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(a))))));
    }, 2300);
  };

  const fmt = (n) => n.toLocaleString('en-US');

  const renderResult = (a) => {
    const f = compute(a);
    const no = formulaNo(a);
    $('#quizLayout').style.display = 'none';
    $('#result').classList.add('is-active');
    $('#progressBar').style.width = '100%';
    window.scrollTo({ top: 0 });

    const title = `${LABELS.goalEn[a.goal]} · ${BASE_SHORT[f.base]} · ${LABELS.flavorEn[a.flavor]}`;
    $('#rNo').textContent = `FORMULA #${no} · ${a.label}`;
    const esc = (s) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
    $('#rTitle').innerHTML = `${esc(a.label)}님을 위한<br><span class="hl-lime">${LABELS.goal[a.goal]}</span> 포뮬러`;
    $('#rLead').textContent = `${LABELS.sportKr[a.sport]} 루틴과 ${a.weight}kg 체중을 기준으로, ${BASE_NAME[f.base]} 베이스에 1회 단백질 ${f.p}g을 맞춤 설계했습니다.`;

    const chips = [`${a.sex === 'm' ? '남성' : '여성'} · ${a.age === '50' ? '50대+' : a.age + '대'}`, `${a.height}cm / ${a.weight}kg`, LABELS.sportKr[a.sport], title];
    const warn = [];
    if (a.allergy.includes('soy')) warn.push('대두 레시틴 제외');
    if (a.allergy.includes('nut')) warn.push('견과 유래 원료 제외');
    if (a.allergy.includes('gluten')) warn.push(a.flavor === 'misu' ? '글루텐 프리 곡물 대체' : '글루텐 프리');
    if (f.base !== 'blend') warn.push('Lactose Free');
    if (a.caffeine === '1') warn.push('Caffeine Free');
    $('#rChips').innerHTML = chips.map((c) => `<span>${c}</span>`).join('') + warn.map((c) => `<span class="warn">${c}</span>`).join('');

    // pouch
    $('#rPouchNo').textContent = '#' + no;
    $('#rPouchName').textContent = `${a.label} FORMULA`;
    $('#rPouchBase').textContent = BASE_NAME[f.base];
    $('#rPouchFlavor').textContent = LABELS.flavorEn[a.flavor];
    const rows = [['Protein', f.p + 'g'], ['Carbs', f.c + 'g'], ['BCAA', fmt(f.bcaa) + 'mg'], ['Enzyme', f.enz + 'mg'], ['Electrolytes', fmt(f.elec) + 'mg']];
    if (f.creatine) rows.push(['Creatine', fmt(f.creatine) + 'mg']);
    else rows.push(['Caffeine', f.caf + 'mg']);
    $('#rPouchRows').innerHTML = rows.map(([k, v]) => `<div class="pouch-row"><span>${k}</span><b>${v}</b></div>`).join('');

    // nutrition table
    $('#rServing').textContent = `1스쿱 (${f.scoop}g) 기준 · ${f.kcal} kcal`;
    const table = [
      ['단백질', BASE_NAME[f.base], f.p + 'g'],
      ['탄수화물', f.c <= 6 ? '저당 · 식이섬유 중심' : '귀리 · 말토덱스트린', f.c + 'g'],
      ['BCAA', '류신 : 이소류신 : 발린 = 2:1:1', fmt(f.bcaa) + 'mg'],
      ['전해질', '나트륨 · 칼륨 · 마그네슘', fmt(f.elec) + 'mg'],
      ['소화효소 복합물', f.base === 'blend' ? '프로테아제 · 락타아제' : '락타아제 강화 배합', f.enz + 'mg'],
      f.creatine ? ['크레아틴', '크레아틴 모노하이드레이트', fmt(f.creatine) + 'mg'] : null,
      ['카페인', f.caf ? '녹차 추출물 유래' : a.caffeine === '1' ? '카페인 민감 → 무첨가' : '무첨가', f.caf + 'mg'],
      ['식이섬유', '치커리 이눌린', f.fiber + 'g'],
    ].filter(Boolean);
    $('#rTable').innerHTML = table.map(([k, s, v]) => `<tr><td>${k}<span class="sub">${s}</span></td><td>${v}</td></tr>`).join('');

    // guide
    const timing = {
      diet: ['아침 공복 또는 운동 직후', '간식 대신 1스쿱으로 대체'],
      bulk: ['운동 후 30분 이내', '취침 전 0.5스쿱 추가 섭취'],
      recovery: ['운동 직후 (장시간 운동 시 운동 중 분할)', '휴식일에는 아침 1스쿱'],
      meal: ['아침 또는 점심 식사 대용', '바나나 · 오트밀과 함께 블렌딩'],
    }[a.goal];
    const water = a.goal === 'meal' ? '300ml (우유/두유 가능)' : '250~300ml 물';
    $('#rGuide').innerHTML = `
      <div><small>1회 섭취량</small><b class="num">${f.scoop}g</b><small style="margin:4px 0 0">계량 스쿱 1개</small></div>
      <div><small>섭취 타이밍</small><b>${timing[0]}</b><small style="margin:4px 0 0">${timing[1]}</small></div>
      <div><small>혼합 방법</small><b>${water}</b><small style="margin:4px 0 0">쉐이커에 15초간 흔들기</small></div>`;

    drawRadar(f);

    // OG-style title for sharing
    document.title = `${a.label}의 맞춤 포뮬러 #${no} | 매직파우더`;
  };

  /* ---------- Radar chart (SVG) ---------- */
  const drawRadar = (f) => {
    const svg = $('#radar');
    const R = 110;
    const axes = [
      ['단백질', f.p / 45, f.p + 'g'],
      ['탄수화물', f.c / 40, f.c + 'g'],
      ['전해질', f.elec / 1000, fmt(f.elec)],
      ['BCAA', f.bcaa / 8000, fmt(f.bcaa)],
      ['소화효소', f.enz / 250, f.enz + 'mg'],
    ];
    const avg = [0.5, 0.35, 0.15, 0.35, 0.1]; // 기성 보충제 평균
    const pt = (i, v) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
      return [Math.cos(ang) * R * v, Math.sin(ang) * R * v];
    };
    const poly = (vals) => vals.map((v, i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');
    let html = '';
    [0.25, 0.5, 0.75, 1].forEach((r) => {
      html += `<polygon points="${poly(axes.map(() => r))}" fill="none" stroke="#26282e" stroke-width="1"/>`;
    });
    axes.forEach((_, i) => {
      const [x, y] = pt(i, 1);
      html += `<line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#26282e"/>`;
    });
    html += `<polygon points="${poly(avg)}" fill="rgba(255,255,255,.04)" stroke="#6c6f76" stroke-dasharray="4 4" stroke-width="1.2"/>`;
    const vals = axes.map(([, v]) => clamp(v, 0.12, 1));
    html += `<polygon class="radar-shape" points="${poly(vals.map(() => 0))}" fill="rgba(204,255,0,.18)" stroke="#ccff00" stroke-width="2" stroke-linejoin="round">
      <animate attributeName="points" from="${poly(vals.map(() => 0))}" to="${poly(vals)}" dur=".9s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/></polygon>`;
    vals.forEach((v, i) => {
      const [x, y] = pt(i, v);
      html += `<circle cx="${x}" cy="${y}" r="3.5" fill="#ccff00"/>`;
    });
    axes.forEach(([label, , valTxt], i) => {
      const [x, y] = pt(i, 1.22);
      const anchor = Math.abs(x) < 5 ? 'middle' : x > 0 ? 'start' : 'end';
      html += `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${label}</text>`;
      html += `<text class="val" x="${x}" y="${y + 15}" text-anchor="${anchor}" dominant-baseline="middle">${valTxt}</text>`;
    });
    html += `<g transform="translate(-160,150)"><rect width="12" height="3" y="-2" fill="#ccff00"/><text x="18" y="0" dominant-baseline="middle" style="font-size:11px">내 포뮬러</text>
      <rect x="90" width="12" height="2" y="-1" fill="#6c6f76"/><text x="108" y="0" dominant-baseline="middle" style="font-size:11px">기성 보충제 평균</text></g>`;
    svg.innerHTML = html;
  };

  /* ---------- Result actions ---------- */
  $('#subscribeBtn').addEventListener('click', () => mpToast('스마트 구독 결제 페이지로 이동합니다. (데모)'));
  $('#cartBtn').addEventListener('click', () => mpToast('맞춤 포뮬러가 장바구니에 담겼어요.'));
  $('#restartBtn').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    location.reload();
  });
  $('#shareBtn').addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); mpToast('내 포뮬러 링크가 복사되었어요!'); }
    } catch { /* user cancelled */ }
  });

  /* ---------- Open shared result (#r=...) ---------- */
  const m = location.hash.match(/^#r=(.+)$/);
  if (m) {
    try {
      const a = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
      const ok = a && LABELS.goal[a.goal] && LABELS.sport[a.sport] && LABELS.flavor[a.flavor]
        && ['1', '2', '3'].includes(a.freq) && ['1', '2', '3'].includes(a.dur) && ['0', '1', '2'].includes(a.lactose)
        && ['0', '1'].includes(a.caffeine) && Array.isArray(a.allergy) && a.weight >= 30 && a.weight <= 200
        && typeof a.label === 'string' && a.label.length <= 16
        && ['m', 'f'].includes(a.sex) && ['10', '20', '30', '40', '50'].includes(a.age)
        && typeof a.height === 'number' && typeof a.weight === 'number'
        && a.allergy.every((x) => ['soy', 'nut', 'gluten', 'none'].includes(x));
      if (ok) renderResult(a);
    } catch { /* invalid hash → start quiz */ }
  }

  showStep(current);
  if (m && $('#result').classList.contains('is-active')) $('#progressBar').style.width = '100%';
})();
