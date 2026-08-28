(function(){
  const root = document.currentScript.parentElement;
  let lang = "uk";
  let history = [];

  const officialDomains = ["diia.gov.ua","privat24.ua","monobank.ua","mvs.gov.ua","nbu.gov.ua"];

  function levenshtein(a,b){
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);
    for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    return dp[m][n];
  }

  function extractDomains(t){
    const m = t.match(/[a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?/gi) || [];
    return m.map(x=>x.toLowerCase());
  }

  const rulesUK = [
    { cat:"Фішингове посилання", level:"high",
      test:(t)=> /\.(site|top|online|cc|help|click)\b/i.test(t),
      msg:"Домен використовує нетипову для офіційних сервісів зону (.site, .top, .online тощо).",
      tip:"Офіційні держсервіси та банки України використовують .gov.ua, .ua — будь-яка інша зона в такому контексті підозріла." },
    { cat:"Підроблений домен (тайпсквотинг)", level:"high",
      test:(t)=> extractDomains(t).some(d => officialDomains.some(o => { const dist = levenshtein(d,o); return dist>0 && dist<=3 && d!==o; })),
      msg:"Домен у повідомленні дуже схожий на офіційний (diia.gov.ua, privat24.ua тощо), але не збігається точно.",
      tip:"Навіть одна зайва літера чи дефіс у домені — ознака підробки. Завжди звіряй адресу посимвольно." },
        { cat:"Запит конфіденційних даних", level:"high",
      test:(t)=> /(cvv|пароль|password|pin-?code|pin-?код|sms code|код з смс|confirm (your )?card|enter (your )?(card|data)|підтвердіть картку|введіть.*(картк|дан))/i.test(t),
      msg:"Повідомлення просить ввести CVV, пароль або дані картки — легітимні сервіси ніколи цього не роблять через посилання в SMS.",
      tip:"Для отримання переказу достатньо номера картки/IBAN. PIN, CVV чи паролі для цього не потрібні нікому й ніколи." },
    { cat:"Заміна SIM / перехоплення номера", level:"high",
      test:(t)=> /(перевипуск|заміна|reissue|replace).{0,15}(сім|sim)/i.test(t) || /(продиктуйте|назвіть|скажіть|read out|dictate|provide|share).{0,20}(код|code)/i.test(t) || /(підтвердіть номер телефону|confirm (your )?phone number)/i.test(t),
      msg:"Схема схожа на спробу перехопити твій номер телефону (SIM-swap), щоб отримати доступ до банкінгу через SMS-коди.",
      tip:"Ніколи не передавай коди підтвердження оператора зв'язку стороннім особам, навіть якщо дзвінок виглядає офіційним." },
    { cat:"Фальшива виплата/компенсація", level:"med",
      test:(t)=> /(виплат|компенсац|субсиді|грант|допомог[аи]|compensation|payout|grant|subsidy|assistance|benefit)/i.test(t) && /(отрима|оформ|призначен|нарахован|receive|granted|assigned|awarded)/i.test(t),
      msg:"Обіцянка виплати чи компенсації в обмін на «підтвердження» даних — одна з найпоширеніших схем 2025–2026 років.",
      tip:"Інформацію про реальні виплати перевіряй лише на офіційних державних чи банківських ресурсах, а не за посиланням з SMS." },
    { cat:"Психологічний тиск / терміновість", level:"med",
      test:(t)=> /(терміново|негайно|протягом \d+ годин|щоб уникнути блокування|остання можливість|urgently|immediately|within \d+ hours?|to avoid (blocking|being blocked)|last chance)/i.test(t),
      msg:"Текст створює штучний поспіх — типовий прийом соціальної інженерії, щоб людина не встигла подумати.",
      tip:"Легітимні служби дають розумний термін і не погрожують блокуванням за кілька годин." },
    { cat:"Прохання від «знайомого»", level:"med",
      test:(t)=> /(допоможи|позич|help|borrow).{0,60}(гроші|кошти|грн|money|cash|uah)/i.test(t) || /(переказ|send|transfer).{0,20}(терміново|негайно|urgently|immediately)/i.test(t) || /(терміново|негайно|urgently|immediately).{0,20}(переказ|send|transfer)/i.test(t),
      msg:"Раптове прохання про гроші «від знайомого» — часто ознака зламаного акаунту в месенджері.",
      tip:"Завжди передзвонюй людині напряму іншим каналом зв'язку, перш ніж переказувати гроші за проханням у чаті." }
  ];

  const rulesEN = rulesUK.map(r => ({...r,
    cat: {
      "Фішингове посилання":"Phishing link",
      "Підроблений домен (тайпсквотинг)":"Look-alike domain (typosquatting)",
      "Запит конфіденційних даних":"Request for sensitive data",
      "Заміна SIM / перехоплення номера":"SIM-swap attempt",
      "Фальшива виплата/компенсація":"Fake payout / compensation",
      "Психологічний тиск / терміновість":"Urgency pressure",
      "Прохання від «знайомого»":"Request from a \"contact\""
    }[r.cat],
    msg: {
      "Фішингове посилання":"The domain uses an unusual zone (.site, .top, .online) rarely used by official services.",
      "Підроблений домен (тайпсквотинг)":"The domain closely resembles an official one (diia.gov.ua, privat24.ua) but doesn't match exactly.",
      "Запит конфіденційних даних":"The message asks for CVV, password or card details — legitimate services never do this via SMS links.",
      "Заміна SIM / перехоплення номера":"This resembles a SIM-swap attempt to hijack your phone number and intercept banking codes.",
      "Фальшива виплата/компенсація":"A promised payout in exchange for 'confirming' your card — one of the most common 2025–2026 scam patterns.",
      "Психологічний тиск / терміновість":"The text creates artificial urgency — a classic social-engineering pressure tactic.",
      "Прохання від «знайомого»":"A sudden money request from a 'contact' often signals a hijacked messenger account."
    }[r.cat],
    tip: {
      "Фішингове посилання":"Official Ukrainian gov/bank services use .gov.ua or .ua — any other zone here is suspicious.",
      "Підроблений домен (тайпсквотинг)":"Even one extra letter or dash in a domain signals a fake. Always check it character by character.",
      "Запит конфіденційних даних":"A card number/IBAN is enough to receive a transfer. PIN or CVV is never required for that.",
      "Заміна SIM / перехоплення номера":"Never share carrier confirmation codes with anyone, even if the call sounds official.",
      "Фальшива виплата/компенсація":"Verify any payout only through official government or bank websites, never via a link from SMS.",
      "Психологічний тиск / терміновість":"Legitimate services give reasonable time and don't threaten to block accounts within hours.",
      "Прохання від «знайомого»":"Always call the person directly through another channel before sending money requested in chat."
    }[r.cat]
  }));

  const samplesUK = [
    "Доброго дня! Вам призначено соціальну компенсацію 4200 грн від Міністерства енергетики. Для отримання коштів терміново підтвердіть номер картки та CVV-код за посиланням: minenergo-vyplaty.site",
    "Шановний користувачу Дії! Виявлено проблему з вашим акаунтом. Щоб уникнути блокування, увійдіть та підтвердіть дані протягом 24 годин: diia-help.online/confirm",
    "Привіт! Завтра зустрічаємось о 18:00 біля метро, як домовлялись. Не забудь взяти документи для оренди."
  ];
  const samplesEN = [
    "Good day! You have been assigned a 4200 UAH social compensation from the Ministry of Energy. To receive it, urgently confirm your card number and CVV via the link: minenergo-vyplaty.site",
    "Dear Diia user! An issue was found with your account. To avoid blocking, log in and confirm your data within 24 hours: diia-help.online/confirm",
    "Hey! Meeting tomorrow at 6pm by the metro as agreed. Don't forget the rental documents."
  ];

  const i18n = {
    uk: { eyebrow:"Диджитал Щит · прототип аналізатора",
      title:'Перш ніж повірити повідомленню —<br><em>дай йому пройти перевірку.</em>',
      sub:"Встав текст підозрілого SMS, повідомлення в Telegram/Viber чи листа — і отримаєш пояснення простою мовою, чому це схоже (або не схоже) на шахрайство.",
      panelLabel:"Текст повідомлення", btn:"Перевірити повідомлення",
      s0:"приклад: фейкова виплата", s1:'приклад: фейкова "Дія"', s2:"приклад: звичайний лист",
      histLabel:"Історія перевірок (ця сесія)",
      footCats:"Категорій виявлення: ", footSrc:"Джерело шаблонів: ",
      badgeHigh:"Висока ймовірність шахрайства", badgeMed:"Є підозрілі ознаки", badgeLow:"Явних ознак шахрайства не виявлено",
      textHigh:(n)=>`Знайдено ${n} тривожні ознаки одночасно. Не переходь за посиланнями і не вводь жодних даних.`,
      textMed:(n)=>`Знайдено ${n} ознак(и), характерних для шахрайських повідомлень. Перевір інформацію лише на офіційному сайті.`,
      textLow:"За цим набором правил підозрілих патернів не знайдено. Це не гарантія безпеки — завжди перевіряй незнайомі посилання самостійно.",
      cleanTip:"Порада: навіть якщо повідомлення виглядає нейтральним, ніколи не вводь пароль, CVV чи код з SMS за переходом з листа.",
      riskLevel:"Рівень ризику" },
    en: { eyebrow:"Digital Shield · analyzer prototype",
      title:'Before you trust a message —<br><em>let it pass a check.</em>',
      sub:"Paste a suspicious SMS, Telegram/Viber message or email — get a plain-language explanation of why it looks (or doesn't look) like a scam.",
      panelLabel:"Message text", btn:"Check message",
      s0:"example: fake payout", s1:'example: fake "Diia"', s2:"example: normal message",
      histLabel:"Check history (this session)",
      footCats:"Detection categories: ", footSrc:"Pattern source: ",
      badgeHigh:"High likelihood of fraud", badgeMed:"Suspicious signs found", badgeLow:"No clear fraud signs detected",
      textHigh:(n)=>`Found ${n} red flags at once. Don't click any links or enter any data.`,
      textMed:(n)=>`Found ${n} sign(s) common in scam messages. Verify information only on the official website.`,
      textLow:"No suspicious patterns found by this ruleset. Not a full guarantee of safety — always verify unfamiliar links yourself.",
      cleanTip:"Tip: even if a message looks neutral, never enter a password, CVV or SMS code after clicking a link from a message.",
      riskLevel:"Risk level" }
  };

  function currentRules(){ return lang === "uk" ? rulesUK : rulesEN; }
  function currentSamples(){ return lang === "uk" ? samplesUK : samplesEN; }

  function renderStatic(){
    const t = i18n[lang];
    root.querySelector("#dswEyebrow").textContent = t.eyebrow;
    root.querySelector("#dswTitle").innerHTML = t.title;
    root.querySelector("#dswSub").textContent = t.sub;
    root.querySelector("#dswPanelLabel").textContent = t.panelLabel;
    root.querySelector("#dswAnalyze").textContent = t.btn;
    root.querySelector("#dswHistoryLabel").textContent = t.histLabel;
    root.querySelector("#dswFooterCats").innerHTML = `${t.footCats}<b>${currentRules().length}</b>`;
    root.querySelector("#dswFooterSrc").innerHTML = `${t.footSrc}<b>${lang==='uk' ? 'реальні схеми 2025–2026' : 'real 2025–2026 scam cases'}</b>`;

    const samplesBox = root.querySelector("#dswSamples");
    const labels = [t.s0, t.s1, t.s2];
    samplesBox.innerHTML = labels.map((l,i)=>`<div class="dsw__sample" data-sample="${i}">${l}</div>`).join("");
    samplesBox.querySelectorAll(".dsw__sample").forEach(el=>{
      el.addEventListener("click", ()=>{ root.querySelector("#dswInput").value = currentSamples()[el.dataset.sample]; });
    });
  }

  function analyze(text){
    if(!text.trim()) return null;
    const hits = currentRules().filter(r => r.test(text));
    const score = hits.reduce((s,h)=> s + (h.level === "high" ? 2 : 1), 0);
    const maxScore = 8;
    let level = "low";
    if(score >= 4) level = "high"; else if(score >= 1) level = "med";
    return { hits, level, pct: Math.min(100, Math.round((score/maxScore)*100)) };
  }

  function render(result, text){
    const box = root.querySelector("#dswResult");
    if(!result){ box.classList.remove("show"); return; }
    const t = i18n[lang];
    const { hits, level, pct } = result;
    const badge = level==="high" ? t.badgeHigh : level==="med" ? t.badgeMed : t.badgeLow;
    const desc = level==="high" ? t.textHigh(hits.length) : level==="med" ? t.textMed(hits.length) : t.textLow;

    let html = `
      <div class="dsw__verdict v-${level}">
        <div class="dsw__verdict-top">
          <div class="dsw__verdict-badge">${badge}</div>
        </div>
        <div class="dsw__verdict-text">${desc}</div>
        <div style="margin-top:12px;">
          <div class="dsw__meter"><div class="dsw__meter-fill" style="width:${pct}%"></div></div>
          <div class="dsw__meter-label">${t.riskLevel}: ${pct}%</div>
        </div>
      </div>`;

    if(hits.length){
      html += `<div class="dsw__flags">` + hits.map(h => `
        <div class="dsw__flag ${h.level}">
          <div class="dsw__flag-cat">${h.cat}</div>
          <div class="dsw__flag-body"><p>${h.msg}</p><p>${h.tip}</p></div>
        </div>`).join("") + `</div>`;
    } else {
      html += `<div class="dsw__clean">${t.cleanTip}</div>`;
    }
    box.innerHTML = html;
    box.classList.add("show");

    history.unshift({ level, snippet: text.slice(0,60) + (text.length>60?"…":"") });
    history = history.slice(0,5);
    renderHistory();
  }

  function renderHistory(){
    const panel = root.querySelector("#dswHistoryPanel");
    const list = root.querySelector("#dswHistoryList");
    if(!history.length){ panel.classList.remove("show"); return; }
    panel.classList.add("show");
    list.innerHTML = history.map(h => `
      <div class="dsw__history-item">
        <div class="dsw__history-dot hd-${h.level}"></div>
        <div class="dsw__history-text">${h.snippet}</div>
      </div>`).join("");
  }

  root.querySelector("#dswAnalyze").addEventListener("click", () => {
    const text = root.querySelector("#dswInput").value;
    const scan = root.querySelector("#dswScan");
    const resultBox = root.querySelector("#dswResult");
    resultBox.classList.remove("show");
    scan.classList.add("active");
    setTimeout(() => { scan.classList.remove("active"); render(analyze(text), text); }, 650);
  });

  root.querySelectorAll(".dsw__lang button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      lang = btn.dataset.lang;
      root.querySelectorAll(".dsw__lang button").forEach(b=>b.classList.toggle("active", b===btn));
      renderStatic();
      root.querySelector("#dswResult").classList.remove("show");
    });
  });

  renderStatic();
})();
