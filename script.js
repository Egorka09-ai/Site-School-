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
    document.querySelectorAll(".intro-statement .w").forEach((w) => (w.style.opacity = "1"));
    document.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = parseInt(el.getAttribute("data-count"), 10).toLocaleString("ru-RU");
    });
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

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById("burger");
  if (burger) {
    burger.addEventListener("click", () => {
      // простое поведение: проскроллить к контактам
      document.getElementById("contact").scrollIntoView({ behavior: "smooth", block: "start" });
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

  /* ---------- Счётчики статистики ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const animateCount = (el) => {
    const target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce) { el.textContent = target.toLocaleString("ru-RU"); return; }
    const dur = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const co = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => co.observe(el));

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

  function showStatus(kind, html) {
    if (!statusBox) return;
    statusBox.className = "form-status form-status--" + kind;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
  }

  /* Запасной путь: собираем текст заявки и предлагаем отправить его
     напрямую в WhatsApp или Telegram. Ничего не теряется. */
  function showFallback(data) {
    const text =
      "Здравствуйте! Хочу записаться на пробный урок.\n" +
      "Имя: " + (data.name || "—") + "\n" +
      "Контакт: " + (data.phone || "—") + "\n" +
      "Язык: " + (data.lang || "—");
    const wa = "https://wa.me/79823419077?text=" + encodeURIComponent(text);
    showStatus(
      "manual",
      "<b>Остался один шаг.</b> Нажмите кнопку ниже — заявка уже собрана, " +
      "останется только отправить её.<div class='form-status-actions'>" +
      "<a class='btn btn-primary' href='" + wa + "' target='_blank' rel='noopener'>Отправить в WhatsApp <span class='arr'>→</span></a>" +
      "<a class='btn btn-ghost' href='https://t.me/ksenya_mgn' target='_blank' rel='noopener'>Написать в Telegram</a>" +
      "<a class='btn btn-ghost' href='tel:+79823419077'>Позвонить</a>" +
      "</div>"
    );
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
          showStatus("ok", "Заявка отправлена. Свяжемся с вами в течение дня.");
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
      const top = t.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
})();
