/* =========================================================
   MAGIC POWDER — shared + landing interactions
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  let toastTimer;
  window.mpToast = (msg) => {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-show'), 2600);
  };
  $$('[data-toast]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    mpToast(el.dataset.toast);
  }));

  /* ---------- GNB ---------- */
  const gnb = $('#gnb');
  const toggle = $('#gnbToggle');
  if (gnb) {
    const onScroll = () => gnb.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toggle?.addEventListener('click', () => {
      const open = gnb.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
    $$('.gnb-nav a').forEach((a) => a.addEventListener('click', () => {
      gnb.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- Count up ---------- */
  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    const start = performance.now();
    const dur = reduceMotion ? 1 : 1800;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* ---------- Hero powder particles ---------- */
  const canvas = $('#heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, cx, cy, parts = [];
    const COLORS = ['204,255,0', '0,210,255', '0,245,155', '255,255,255'];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = w < 1080;
      cx = mobile ? w / 2 : w * 0.73;
      cy = mobile ? h * 0.72 : h * 0.5;
      const n = Math.round(Math.min(320, (w * h) / 5200));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (initial) => {
      const maxR = Math.max(w, h) * 0.62;
      return {
        a: Math.random() * Math.PI * 2,
        r: initial ? 60 + Math.random() * maxR : maxR * (0.7 + Math.random() * 0.3),
        s: 0.002 + Math.random() * 0.006,
        pull: 0.25 + Math.random() * 0.9,
        size: Math.random() < 0.85 ? 0.6 + Math.random() * 1.4 : 2 + Math.random() * 1.6,
        c: COLORS[Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : Math.random() < 0.5 ? 2 : 3],
        o: 0.25 + Math.random() * 0.6,
        tilt: 0.55 + Math.random() * 0.25,
      };
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.a += p.s * (1 + 160 / (p.r + 40));
        p.r -= p.pull;
        if (p.r < 70) Object.assign(p, spawn(false));
        const x = cx + Math.cos(p.a) * p.r;
        const y = cy + Math.sin(p.a) * p.r * p.tilt;
        const fade = Math.min(1, (p.r - 70) / 120);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${p.o * fade})`;
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };
    let raf;
    resize();
    draw();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); draw(); });
    // pause when hero is off-screen
    new IntersectionObserver(([en]) => {
      cancelAnimationFrame(raf);
      if (en.isIntersecting && !reduceMotion) draw();
    }).observe(canvas);
  }

  /* ---------- Hero typing label ---------- */
  const heroName = $('#heroName');
  if (heroName) {
    const profiles = [
      { name: 'KIM MIN-SU FORMULA #0815', base: 'WPI + 완두 분리단백 · Lactose Free', rows: ['32g', '4g', '5,000mg', '100mg', '300mg'] },
      { name: 'LEE JI-WON FORMULA #1204', base: '식물성 완두·쌀 분리단백 · Vegan', rows: ['26g', '18g', '7,000mg', '150mg', '800mg'] },
      { name: 'PARK HYUN FORMULA #2290', base: 'WPI + WPC 블렌드 · Creatine 5g', rows: ['40g', '24g', '6,000mg', '100mg', '400mg'] },
    ];
    const rowEls = $$('#heroRows .pouch-row b');
    const baseEl = $('#heroBase');
    const chip = $('#chipProtein');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async function loop(i = 0) {
      const p = profiles[i % profiles.length];
      heroName.textContent = '';
      baseEl.innerHTML = '&nbsp;';
      rowEls.forEach((b) => (b.textContent = '—'));
      for (const ch of p.name) {
        heroName.textContent += ch;
        await sleep(reduceMotion ? 0 : 55);
      }
      await sleep(250);
      baseEl.textContent = p.base;
      for (let k = 0; k < rowEls.length; k++) {
        rowEls[k].textContent = p.rows[k];
        rowEls[k].classList.add('flash');
        setTimeout(() => rowEls[k].classList.remove('flash'), 600);
        await sleep(220);
      }
      if (chip) chip.textContent = p.rows[0];
      await sleep(3800);
      loop(i + 1);
    })();
  }

  /* ---------- Formula simulator ---------- */
  const simGoal = $('#simGoal');
  if (simGoal) {
    const GOALS = {
      cut:  { name: 'CUT FORMULA',       p: 32, c: 4,  bcaa: 5000, elec: 300, caf: 120, extra: ['L-Carnitine', '1,000mg'] },
      lean: { name: 'LEAN MASS FORMULA', p: 38, c: 22, bcaa: 6000, elec: 400, caf: 0,   extra: ['Creatine', '5,000mg'] },
      run:  { name: 'ENDURANCE FORMULA', p: 24, c: 30, bcaa: 7000, elec: 800, caf: 80,  extra: ['Beta-Alanine', '1,600mg'] },
    };
    const TYPES = {
      lactose:  { base: 'WPI + 완두 분리단백 · Lactose Free', enz: 200, cafOff: false },
      caffeine: { base: 'WPI + WPC 블렌드 · Caffeine Free',  enz: 100, cafOff: true },
      normal:   { base: 'WPI + WPC 블렌드 · Standard',       enz: 100, cafOff: false },
    };
    const state = { goal: 'cut', type: 'normal' };
    const prev = {};
    const fmt = (n) => n.toLocaleString('en-US');

    const tween = (el, key, to, unit) => {
      const from = prev[key] ?? to;
      prev[key] = to;
      if (from !== to) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 700); }
      const start = performance.now();
      const dur = reduceMotion ? 1 : 600;
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
        el.textContent = fmt(v) + unit;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const rowsEl = $('#simRows');
    const barsEl = $('#simBars');
    const ROWS = [
      ['Protein', 'p', 'g'], ['Carbs', 'c', 'g'], ['BCAA', 'bcaa', 'mg'], ['Enzyme', 'enz', 'mg'], ['Electrolytes', 'elec', 'mg'], ['Caffeine', 'caf', 'mg'],
    ];
    rowsEl.innerHTML = ROWS.map(([l, k]) => `<div class="pouch-row"><span>${l}</span><b data-k="${k}">—</b></div>`).join('')
      + '<div class="pouch-row"><span id="simExtraL"></span><b id="simExtraV"></b></div>';
    const BARS = [
      ['단백질', 'p', 'g', 45, ''], ['탄수화물', 'c', 'g', 40, ''], ['BCAA', 'bcaa', 'mg', 8000, ''], ['전해질', 'elec', 'mg', 1000, 'cyan'],
    ];
    barsEl.innerHTML = BARS.map(([l, k, u, , col]) => `
      <div><div class="sim-bar-top"><span>${l}</span><b data-bk="${k}">—</b></div>
      <div class="sim-track"><div class="sim-fill ${col ? 'sim-fill--cyan' : ''}" data-bf="${k}" style="width:0"></div></div></div>`).join('');

    const render = () => {
      const g = GOALS[state.goal], t = TYPES[state.type];
      const v = { p: g.p, c: g.c, bcaa: g.bcaa, elec: g.elec, enz: t.enz, caf: t.cafOff ? 0 : g.caf };
      ROWS.forEach(([, k, u]) => tween($(`[data-k="${k}"]`, rowsEl), k, v[k], u));
      BARS.forEach(([, k, u, max]) => {
        tween($(`[data-bk="${k}"]`, barsEl), 'bar' + k, v[k], u);
        $(`[data-bf="${k}"]`, barsEl).style.width = Math.min(100, (v[k] / max) * 100) + '%';
      });
      $('#simExtraL').textContent = g.extra[0];
      $('#simExtraV').textContent = g.extra[1];
      $('#simName').textContent = g.name;
      $('#simBase').textContent = t.base;
      const kcal = v.p * 4 + v.c * 4 + 8;
      $('#simKcal').textContent = `${kcal} kcal / serving`;
      const no = { cut: 1, lean: 4, run: 7 }[state.goal] * 1000 + { lactose: 115, caffeine: 342, normal: 608 }[state.type];
      $('#simNo').textContent = '#' + String(no).padStart(4, '0');
      $('#simCta').href = `quiz.html?goal=${state.goal}&type=${state.type}`;
    };

    const bindSeg = (wrap, key) => $$('button', wrap).forEach((b) => b.addEventListener('click', () => {
      $$('button', wrap).forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-checked', 'false'); });
      b.classList.add('is-active'); b.setAttribute('aria-checked', 'true');
      state[key] = b.dataset.v;
      render();
    }));
    bindSeg(simGoal, 'goal');
    bindSeg($('#simType'), 'type');
    render();
  }

  /* ---------- Reviews ---------- */
  const reviewGrid = $('#reviewGrid');
  if (reviewGrid) {
    const REVIEWS = [
      { cat: ['weight', 'lactose'], tags: ['30대 직장인', '주 4회 크로스핏', '4주 구독 중'], m: [['체지방률', '-3.2%'], ['복부 팽만감', '제로']],
        text: '시중 프로틴만 먹으면 여드름 나고 설사했는데, 식물성+WPI 커스텀 포뮬러로 바꾸고 속이 너무 편합니다. 3통 사두던 보충제 비용도 절반으로 줄었어요.',
        no: 'MP-0815', name: '김*수', flavor: '더블 초콜릿', c: '#7a4a2d' },
      { cat: ['diet'], tags: ['20대 대학생', '주 3회 필라테스', '3개월 구독 중'], m: [['체중', '-5.4kg'], ['허리둘레', '-6cm']],
        text: '다이어트용이라 탄수 4g으로 맞춰주니까 아침 대용으로 딱이에요. 말차 맛이 진짜 말차라서 질리지 않고, 달달한 인공 감미료 맛이 없어서 좋아요.',
        no: 'MP-1931', name: '이*원', flavor: '말차', c: '#7fb24a' },
      { cat: ['run'], tags: ['40대 직장인', '주 5회 러닝', '2개월 구독 중'], m: [['하프 기록', '-7분 12초'], ['근육통 회복', '2일→1일']],
        text: '전해질이랑 BCAA가 한 번에 들어가 있어서 롱런 후에 따로 챙길 게 없어요. 매달 기록 변화에 맞춰 탄수 비율이 조금씩 바뀌는 게 신기합니다.',
        no: 'MP-2207', name: '박*호', flavor: '클린 무맛', c: '#d7d9de' },
      { cat: ['weight'], tags: ['20대 직장인', '주 5회 웨이트', '6개월 구독 중'], m: [['골격근량', '+2.8kg'], ['벤치프레스', '+15kg']],
        text: '크레아틴, BCAA, 프로틴을 따로 사던 걸 하나로 합쳤어요. 1g 단위로 맞춰준다는 게 처음엔 마케팅인 줄 알았는데 인바디 수치 넣을 때마다 진짜 배합이 바뀝니다.',
        no: 'MP-0442', name: '정*민', flavor: '더블 초콜릿', c: '#7a4a2d' },
      { cat: ['lactose', 'diet'], tags: ['30대 주부', '주 3회 홈트', '5주 구독 중'], m: [['체지방률', '-2.1%'], ['소화 불편', '없음']],
        text: '우유만 마셔도 배가 아파서 단백질 보충은 포기했었는데 100% 식물성 베이스로 받아보고 처음으로 꾸준히 먹고 있어요. 미숫가루 맛 최고!',
        no: 'MP-3318', name: '최*영', flavor: '고소한 미숫가루', c: '#d9bd84' },
      { cat: ['run', 'lactose'], tags: ['30대 프리랜서', '주 4회 사이클', '4개월 구독 중'], m: [['FTP', '+18W'], ['운동 중 복통', '제로']],
        text: '라이딩 중에 마시면 늘 속이 부글거렸는데 WPI + 소화효소 조합으로 완전히 해결. 카페인 민감 체크했더니 오후 라이딩 후에도 잠 잘 와요.',
        no: 'MP-2765', name: '한*진', flavor: '클린 무맛', c: '#d7d9de' },
      { cat: ['diet', 'weight'], tags: ['40대 자영업', '주 4회 웨이트', '8주 구독 중'], m: [['체중', '-4.1kg'], ['골격근량', '유지']],
        text: '근손실 없이 감량하는 게 목표였는데 단백질은 높게, 탄수는 낮게 딱 맞춰주니 식단 관리가 쉬워졌어요. 라벨에 제 이름 박혀있는 것도 은근히 동기부여 됩니다.',
        no: 'MP-1588', name: '윤*석', flavor: '더블 초콜릿', c: '#7a4a2d' },
    ];
    const render = (f) => {
      const list = REVIEWS.filter((r) => f === 'all' || r.cat.includes(f)).slice(0, 6);
      reviewGrid.innerHTML = list.map((r, i) => `
        <article class="review-card" style="animation-delay:${i * 60}ms">
          <div class="review-tags">${r.tags.map((t) => `<span>${t}</span>`).join('')}</div>
          <div class="review-metric">${r.m.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
          <div class="review-stars">★★★★★</div>
          <p class="review-text">“${r.text}”</p>
          <div class="review-foot">
            <span class="mini-pouch" style="--c:${r.c}" aria-hidden="true"></span>
            <div><b>${r.no}</b><span>${r.name} · ${r.flavor} · 실물 인증</span></div>
          </div>
        </article>`).join('');
    };
    $$('#reviewTabs .tab').forEach((t) => t.addEventListener('click', () => {
      $$('#reviewTabs .tab').forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('is-active'); t.setAttribute('aria-selected', 'true');
      render(t.dataset.f);
    }));
    render('all');
  }

  /* ---------- FAQ: one open at a time ---------- */
  const faq = $$('#faqList details');
  faq.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faq.forEach((o) => o !== d && (o.open = false));
  }));
})();
