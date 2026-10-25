/* ============================================================
   RESULT — интерактив и анимации
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     TELEGRAM — уведомления о заявках
     ------------------------------------------------------------
     ⚠️ ВНИМАНИЕ. Этот файл открыт всему интернету: всё, что здесь
     написано, любой посетитель прочитает через «Просмотр кода».
     Вписанный сюда токен бота станет публичным, и управлять ботом
     сможет кто угодно. НЕ вставляйте сюда рабочий токен.

     Безопасный способ — принимать заявки через посредника, который
     хранит токен у себя: Formspree, Google Форма или небольшой бот
     на бесплатном хостинге. Тогда сюда попадает только адрес
     обработчика, а не секрет.

     Пока поля пустые, форма НЕ делает вид, что заявка отправлена:
     она показывает готовый текст обращения и кнопки «отправить в
     WhatsApp / написать в Telegram / позвонить». Заявка не теряется.
     ============================================================ */
  const TELEGRAM = {
    BOT_TOKEN: "",   // напр. "8123456789:AAH7s...your-token..."
    CHAT_ID:   "",   // напр. "123456789"
  };

  async function sendToTelegram(data) {
    if (!TELEGRAM.BOT_TOKEN || !TELEGRAM.CHAT_ID) {
      console.warn("Telegram не настроен: укажите BOT_TOKEN и CHAT_ID в script.js");
      return false;
    }
    const text =
      "🎓 *Новая заявка — Result*\n\n" +
      "👤 Имя: " + (data.name || "—") + "\n" +
      "📞 Контакт: " + (data.phone || "—") + "\n" +
      "🌍 Язык: " + (data.lang || "—") + "\n" +
      "🕒 " + new Date().toLocaleString("ru-RU");
    const url = "https://api.telegram.org/bot" + TELEGRAM.BOT_TOKEN + "/sendMessage";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM.CHAT_ID, text, parse_mode: "Markdown" }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.description || "Telegram error");
    return true;
  }

  /* ---------- Запуск hero ---------- */
  window.addEventListener("load", () => {
    requestAnimationFrame(() => document.body.classList.add("loaded"));
  });
  // подстраховка, если load уже прошёл
  setTimeout(() => document.body.classList.add("loaded"), 600);

  /* ---------- Жёсткий failsafe видимости ----------
     Не полагаемся на детект таймлайна. Измеряем РЕАЛЬНЫЙ результат
     hero-анимации: если к нужному моменту контент так и не показался —
     значит анимации/Observer в этой среде не работают, и мы принудительно
     раскрываем ВЕСЬ контент. Первый посетитель никогда не видит пустую
     страницу. На нормальных браузерах эта ветка не срабатывает. */
  function translateYOf(el) {
    const t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    const m = t.match(/matrix3?d?\(([^)]+)\)/);
    if (!m) return 0;
    const v = m[1].split(",").map((n) => parseFloat(n));
    if (v.length === 6) return v[5];
    if (v.length === 16) return v[13];
    return 0;
  }
  function revealEverything() {
    document.body.classList.add("loaded", "no-anim");
    document.querySelectorAll(".reveal, .step").forEach((el) => el.classList.add("in"));
  }
  let failsafeRan = false;
  function checkVisibility() {
    if (failsafeRan) return;
    failsafeRan = true;
    const lead = document.querySelector(".hero-lead");
    const span = document.querySelector(".hero-title .line > span");
    const leadOK = lead ? parseFloat(getComputedStyle(lead).opacity) > 0.5 : true;
    const spanOK = span ? Math.abs(translateYOf(span)) < 20 : true;
    if (!(leadOK && spanOK)) revealEverything();
  }
  // запускаем проверку с запасом после того, как hero-анимация должна завершиться
  if (document.readyState === "complete") setTimeout(checkVisibility, 1700);
  else window.addEventListener("load", () => setTimeout(checkVisibility, 1700));
  // абсолютный бэкстоп — на случай, если load так и не наступит
  setTimeout(checkVisibility, 3200);

  /* ---------- Навигация: фон при скролле ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Блокировка прокрутки ----------
     overflow:hidden на body не держит прокрутку в iOS Safari, поэтому
     фиксируем страницу и запоминаем позицию, чтобы вернуть её при закрытии.
     Замок общий для меню и лайтбокса: если открыты оба, позицию возвращает
     только последний закрывшийся — иначе страница прыгнет в начало. */
  let savedScroll = 0;
  let locks = 0;
  const lockScroll = (lock, cls) => {
    if (lock) {
      if (locks === 0) {
        savedScroll = window.scrollY;
        document.body.style.top = -savedScroll + "px";
      }
      locks += 1;
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
      locks = Math.max(0, locks - 1);
      if (locks === 0) {
        document.body.style.top = "";
        window.scrollTo(0, savedScroll);
      }
    }
  };

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (burger && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.hidden = !open;
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      lockScroll(open, "menu-open");
      if (open) {
        const first = mobileMenu.querySelector("a");
        if (first) first.focus();
      } else {
        burger.focus();
      }
    };
    burger.addEventListener("click", () => setMenu(mobileMenu.hidden));
    // любой переход по пункту закрывает меню
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("keydown", (e) => {
      if (mobileMenu.hidden) return;
      if (e.key === "Escape") { setMenu(false); return; }
      // меню на весь экран: не выпускаем фокус на ссылки под ним
      if (e.key !== "Tab") return;
      const items = mobileMenu.querySelectorAll("a");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    // если экран стал широким, меню больше не нужно
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860 && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ---------- Reveal через IntersectionObserver ---------- */
  const reveals = document.querySelectorAll(".reveal");
  const ro = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          ro.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => ro.observe(el));

  /* ---------- Лестница уровней: ступенчатый показ ---------- */
  const stairs = document.getElementById("stairs");
  if (stairs) {
    const steps = stairs.querySelectorAll(".step");
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            steps.forEach((step, i) => {
              setTimeout(() => step.classList.add("in"), reduce ? 0 : i * 160);
            });
            so.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    so.observe(stairs);
  }

  /* ---------- Hero: параллакс свечения за курсором ---------- */
  const glow = document.getElementById("heroGlow");
  const hero = document.querySelector(".hero");
  if (glow && hero && !reduce) {
    const spans = glow.querySelectorAll("span");
    let tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener("mousemove", (ev) => {
      const r = hero.getBoundingClientRect();
      tx = (ev.clientX / r.width - 0.5) * 2;
      ty = (ev.clientY / r.height - 0.5) * 2;
    });
    hero.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    const depths = [26, -34, 18];
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      spans.forEach((s, i) => {
        const d = depths[i] || 20;
        s.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Hero: лёгкий параллакс заголовка при скролле ---------- */
  const heroInner = document.querySelector(".hero-inner");
  if (heroInner && !reduce) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroInner.style.transform = `translateY(${y * 0.18}px)`;
        heroInner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.85)));
      }
    }, { passive: true });
  }

  /* ---------- Цикличное приветствие (если есть) ---------- */
  // зарезервировано: точка-акцент пульсирует тонко через CSS-неон не требуется

  /* ---------- Форма ---------- */
  const statusBox = document.getElementById("formStatus");

  function showStatus(kind, nodes) {
    if (!statusBox) return;
    statusBox.className = "form-status form-status--" + kind;
    statusBox.replaceChildren.apply(statusBox, nodes);
    statusBox.hidden = false;
  }

  function makeLink(cls, href, label) {
    const a = document.createElement("a");
    a.className = cls;
    // setAttribute, а не склейка строк: имя с апострофом (О'Коннор)
    // разорвало бы атрибут href при сборке разметки текстом.
    a.setAttribute("href", href);
    if (!href.startsWith("tel:")) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    }
    a.textContent = label;
    return a;
  }

  /* Запасной путь: собираем текст заявки и предлагаем отправить его
     напрямую в WhatsApp или Telegram. Ничего не теряется. */
  function showFallback(data) {
    const text =
      "Здравствуйте! Хочу записаться на занятия.\n" +
      "Имя: " + (data.name || "—") + "\n" +
      "Контакт: " + (data.phone || "—") + "\n" +
      "Язык: " + (data.lang || "—");
    const wa = "https://wa.me/79823419077?text=" + encodeURIComponent(text);

    const lead = document.createElement("p");
    const strong = document.createElement("b");
    strong.textContent = "Остался один шаг.";
    lead.appendChild(strong);
    lead.appendChild(
      document.createTextNode(" Нажмите кнопку ниже — заявка уже собрана, останется только отправить её.")
    );

    const actions = document.createElement("div");
    actions.className = "form-status-actions";
    actions.append(
      makeLink("btn btn-primary", wa, "Отправить в WhatsApp →"),
      makeLink("btn btn-ghost", "https://t.me/ksenya_mgn", "Написать в Telegram"),
      makeLink("btn btn-ghost", "tel:+79823419077", "Позвонить")
    );

    showStatus("manual", [lead, actions]);
  }

  const form = document.getElementById("trialForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      const original = btn.innerHTML;
      const data = {
        name: form.querySelector("#name")?.value.trim(),
        phone: form.querySelector("#phone")?.value.trim(),
        lang: form.querySelector("#lang")?.value,
      };

      btn.disabled = true;
      btn.innerHTML = "Отправляем…";

      try {
        const sent = await sendToTelegram(data);
        if (sent) {
          const ok = document.createElement("p");
          ok.textContent = "Заявка отправлена. Свяжемся с вами в течение дня.";
          showStatus("ok", [ok]);
          btn.innerHTML = "Готово ✦";
          form.reset();
        } else {
          // Автоотправка не настроена — честно говорим об этом и даём прямые
          // каналы, вместо того чтобы показывать «спасибо» и потерять заявку.
          showFallback(data);
          btn.innerHTML = original;
        }
      } catch (err) {
        console.error(err);
        showFallback(data);
        btn.innerHTML = original;
      }

      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 3600);
    });
  }

  /* ---------- Плавный якорный скролл с учётом фикс-навбара ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      // отступ считаем по реальной высоте шапки: она разная до и после
      // прокрутки, а на мобильном ещё и своя
      const navEl = document.getElementById("nav");
      const offset = (navEl ? navEl.offsetHeight : 70) + 12;
      const top = t.getBoundingClientRect().top + window.scrollY - offset;
      // при отключённом движении проезд всей страницы недопустим
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- Отзывы: полный текст в отдельном окне ----------
     Карточки в сетке одного размера и не меняют высоту при открытии:
     длинный отзыв показываем в окне, туда же уходит версия на языке,
     который ученик учит. */
  const rv = document.getElementById("rvModal");
  const reviewCards = Array.prototype.slice.call(document.querySelectorAll(".review-card"));
  if (rv && reviewCards.length) {
    const rvName = document.getElementById("rvName");
    const rvAvatar = document.getElementById("rvAvatar");
    const rvBody = document.getElementById("rvBody");
    const rvLang = document.getElementById("rvLang");
    const rvClose = document.getElementById("rvClose");
    let opener = null;
    let mainP = null;
    let altP = null;

    const open = (card) => {
      opener = card.querySelector(".review-open") || card;
      const name = card.dataset.name || "";
      rvName.textContent = name;
      rvAvatar.textContent = name.charAt(0);
      rvAvatar.style.setProperty("--av-hue", card.dataset.hue || "210");

      rvBody.textContent = "";
      mainP = document.createElement("p");
      mainP.textContent = card.querySelector(".review-text").textContent;
      rvBody.appendChild(mainP);

      const alt = card.querySelector(".review-alt");
      altP = null;
      if (alt) {
        altP = document.createElement("p");
        altP.className = "review-alt";
        altP.lang = alt.lang;
        altP.textContent = alt.textContent;
        altP.hidden = true;
        rvBody.appendChild(altP);
        rvLang.hidden = false;
        rvLang.dataset.alt = alt.dataset.label || "In English";
        rvLang.textContent = rvLang.dataset.alt;
      } else {
        rvLang.hidden = true;
      }

      rvBody.scrollTop = 0;
      rv.hidden = false;
      lockScroll(true, "rv-open");
      rvClose.focus();
    };

    const close = () => {
      rv.hidden = true;
      lockScroll(false, "rv-open");
      if (opener) opener.focus();
      opener = null;
    };

    reviewCards.forEach((card) => {
      card.addEventListener("click", () => open(card));
      const btn = card.querySelector(".review-open");
      if (btn) {
        btn.setAttribute("aria-label", "Читать целиком отзыв: " + (card.dataset.name || ""));
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          open(card);
        });
      }
    });

    rvLang.addEventListener("click", () => {
      if (!altP || !mainP) return;
      const showAlt = altP.hidden;
      altP.hidden = !showAlt;
      mainP.hidden = showAlt;
      rvLang.textContent = showAlt ? "По-русски" : rvLang.dataset.alt;
      rvBody.scrollTop = 0;
    });

    rv.querySelectorAll("[data-rv-close]").forEach((el) =>
      el.addEventListener("click", close)
    );

    document.addEventListener("keydown", (e) => {
      if (rv.hidden) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      const items = Array.prototype.slice
        .call(rv.querySelectorAll("button, [tabindex='0']"))
        .filter((el) => !el.hidden && el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- Лайтбокс галереи ---------- */
  const lb = document.getElementById("lightbox");
  const shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  if (lb && shots.length) {
    const lbImg = document.getElementById("lbImg");
    const lbCaption = document.getElementById("lbCaption");
    const lbCounter = document.getElementById("lbCounter");
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");
    const lbClose = document.getElementById("lbClose");
    let current = -1;
    let opener = null;

    // соседние кадры подгружаем заранее: перелистывание без белой паузы
    const warm = (i) => {
      const btn = shots[(i + shots.length) % shots.length];
      if (!btn) return;
      const im = new Image();
      im.src = btn.href;
    };

    const show = (i) => {
      current = (i + shots.length) % shots.length;
      const btn = shots[current];
      const thumb = btn.querySelector("img");
      const text = thumb ? thumb.alt : "";
      // размеры ставим заранее, чтобы кадр не прыгал при подмене src
      if (btn.dataset.w) lbImg.width = btn.dataset.w;
      if (btn.dataset.h) lbImg.height = btn.dataset.h;
      lbImg.src = btn.href;
      lbImg.alt = text;
      lbCaption.textContent = text;
      lbCounter.textContent = current + 1 + " из " + shots.length;
      warm(current + 1);
      warm(current - 1);
    };

    const open = (i) => {
      opener = shots[i];
      show(i);
      lb.hidden = false;
      lockScroll(true, "lb-open");
      lbClose.focus();
    };

    const close = () => {
      lb.hidden = true;
      lockScroll(false, "lb-open");
      // освобождаем память: большой кадр больше не нужен
      lbImg.removeAttribute("src");
      if (opener) opener.focus();
      opener = null;
      current = -1;
    };

    // без JS ссылка просто откроет снимок — поэтому перехватываем клик здесь
    shots.forEach((btn, i) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        open(i);
      })
    );
    lbPrev.addEventListener("click", () => show(current - 1));
    lbNext.addEventListener("click", () => show(current + 1));
    lb.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", close)
    );

    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); return; }
      // не выпускаем фокус из окна просмотра на ссылки под ним
      if (e.key !== "Tab") return;
      const items = [lbPrev, lbNext, lbClose];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
})();
