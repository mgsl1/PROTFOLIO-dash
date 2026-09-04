/* ============================================================
   SUPABASE CLIENT
============================================================ */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  user: null,
  profile: null,
  route: "dashboard",
};

/* ============================================================
   SMALL HELPERS
============================================================ */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $all(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
}
function i18nPreview(val) {
  if (!val) return "—";
  if (typeof val === "string") return val;
  return val.en || val.fr || val.ar || Object.values(val)[0] || "—";
}
function slugify(str) {
  return String(str || "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
function uid() { return Math.random().toString(36).slice(2, 9); }

/* ============================================================
   INTERFACE LANGUAGE (English / Arabic UI + RTL)
   Separate from the per-record content languages (LANGS below,
   which are the EN/FR/AR tabs used inside i18n content fields).
============================================================ */
let LANG = localStorage.getItem("adminLang") || "en";
function tf(en, ar) { return LANG === "ar" ? ar : en; }
function applyLangToDocument() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
}
function toggleLang() {
  LANG = LANG === "ar" ? "en" : "ar";
  localStorage.setItem("adminLang", LANG);
  applyLangToDocument();
  if (state.user) { renderAppShell(); } else { renderLoginScreen(); }
}
applyLangToDocument();

/* Dictionary for static field/column/section labels used across the
   generic form + table engine (SCHEMAS/SINGLETONS/PROJECT_FIELDS/NAV).
   t() looks the English label up; falls back to the English text
   itself if no Arabic entry exists yet. */
const AR_STRINGS = {
  "Overview": "نظرة عامة", "Content": "المحتوى", "Site": "الموقع", "Inbox": "الرسائل الواردة", "Admin": "المسؤول",
  "Dashboard": "لوحة القيادة", "Hero Section": "قسم الواجهة الرئيسية", "About Section": "قسم من أنا",
  "Statistics": "الإحصائيات", "Services": "الخدمات", "Tech Categories": "فئات التقنيات", "Technologies": "التقنيات",
  "Project Categories": "فئات المشاريع", "Projects": "المشاريع", "Experience": "الخبرة", "Education": "التعليم",
  "Certificates": "الشهادات", "Testimonials": "آراء العملاء", "FAQs": "الأسئلة الشائعة",
  "Custom Sections": "أقسام مخصصة", "Pages": "الصفحات", "Site Settings": "إعدادات الموقع", "SEO": "تحسين محركات البحث",
  "Navigation": "قائمة التنقل", "Social Links": "روابط التواصل الاجتماعي", "External Links": "روابط خارجية",
  "Downloads": "الملفات القابلة للتحميل", "Translations": "الترجمات", "Messages": "الرسائل",
  "Contact Info": "معلومات التواصل", "Users": "المستخدمون", "Technology Categories": "فئات التقنيات",
  "SEO Settings": "إعدادات السيو",
  "The first thing visitors see on your homepage": "أول ما يراه الزوار في صفحتك الرئيسية",
  "Your story, shown on the homepage": "قصتك، تظهر في الصفحة الرئيسية",
  "Contact details shown in the footer / contact section": "بيانات التواصل الظاهرة في التذييل وقسم التواصل",
  "Global configuration for the whole website": "الإعدادات العامة لكامل الموقع",
  "Category": "فئة", "Certificate": "شهادة", "Education entry": "سجل تعليمي", "FAQ": "سؤال شائع",
  "File": "ملف", "Link": "رابط", "Menu item": "عنصر قائمة", "Page": "صفحة", "Page SEO": "سيو الصفحة",
  "Project": "مشروع", "Section": "قسم", "Service": "خدمة", "Social link": "رابط تواصل اجتماعي",
  "Statistic": "إحصائية", "Technology": "تقنية", "Testimonial": "رأي عميل", "Translation": "ترجمة",
  "Address": "العنوان", "Allow following links": "السماح بمتابعة الروابط", "Allow indexing": "السماح بالفهرسة",
  "Answer": "الإجابة", "App Store URL": "رابط App Store", "Arabic": "العربية", "Archived": "مؤرشف",
  "Availability text": "نص التوفر", "Avatar": "الصورة الرمزية", "Background image": "صورة الخلفية",
  "Badge text (optional)": "نص الشارة (اختياري)", "Brand color": "لون العلامة التجارية", "Button Text": "نص الزر",
  "Button URL": "رابط الزر", "Button text": "نص الزر", "CV file (PDF)": "ملف السيرة الذاتية (PDF)",
  "Canonical URL": "الرابط الأساسي (Canonical)", "Certificate image": "صورة الشهادة",
  "Certificate verification URL": "رابط التحقق من الشهادة", "City": "المدينة", "Client country": "بلد العميل",
  "Client name": "اسم العميل", "Code snippet shown in the hero": "مقتطف الكود الظاهر في الواجهة الرئيسية",
  "Code window title": "عنوان نافذة الكود", "Company": "الشركة", "Company URL": "رابط الشركة",
  "Company logo": "شعار الشركة", "Company name": "اسم الشركة", "Contact description": "وصف التواصل",
  "Contact heading": "عنوان قسم التواصل", "Copyright text": "نص حقوق النشر", "Country": "البلد",
  "Cover image": "صورة الغلاف", "Cover image (optional)": "صورة الغلاف (اختياري)",
  "Credential ID": "معرّف الشهادة", "Currency": "العملة", "Currently available for work": "متاح للعمل حاليًا",
  "Currently working here": "أعمل هنا حاليًا", "Custom CSS (advanced)": "CSS مخصص (متقدم)",
  "Custom JS (advanced)": "JS مخصص (متقدم)", "Dark": "داكن", "Default language": "اللغة الافتراضية",
  "Default theme": "المظهر الافتراضي", "Degree": "الشهادة الجامعية", "Demo URL": "رابط العرض التجريبي",
  "Description": "الوصف", "Draft": "مسودة", "Employment type (e.g. Full-time, Freelance)": "نوع التوظيف (مثال: دوام كامل، عمل حر)",
  "Enable contact form": "تفعيل نموذج التواصل", "End": "النهاية", "End Date": "تاريخ النهاية",
  "End date": "تاريخ النهاية", "English": "الإنجليزية", "Expiry Date": "تاريخ الانتهاء", "Eyebrow": "نص علوي",
  "Favicon": "أيقونة الموقع (Favicon)", "Feature bullets": "نقاط الميزات", "Featured": "مميز",
  "Featured project": "مشروع مميز", "Field of Study": "مجال الدراسة", "File type": "نوع الملف",
  "Footer text": "نص التذييل", "French": "الفرنسية", "Full Description": "الوصف الكامل",
  "Full bio": "السيرة الكاملة", "GitHub URL": "رابط GitHub",
  "Heading prefix (e.g. \"I am\")": "بادئة العنوان (مثال: \"أنا\")",
  "Hero image (desktop)": "صورة الواجهة (سطح المكتب)", "Hero image (mobile)": "صورة الواجهة (الجوال)",
  "Homepage": "الصفحة الرئيسية", "Icon Image (optional)": "صورة الأيقونة (اختياري)",
  "Icon image (optional)": "صورة الأيقونة (اختياري)", "Icon key": "مفتاح الأيقونة",
  "Icon key (devicon-style, used if no image)": "مفتاح الأيقونة (بنمط devicon، يُستخدم عند غياب الصورة)",
  "Image": "صورة", "Indexed": "مفهرس", "Institution": "المؤسسة", "Institution Name": "اسم المؤسسة",
  "Institution logo": "شعار المؤسسة", "Issue Date": "تاريخ الإصدار", "Issued": "صدرت في",
  "Issuing organization": "الجهة المانحة", "Job Title": "المسمى الوظيفي", "Key": "المفتاح",
  "Key (unique)": "المفتاح (فريد)", "Key features": "الميزات الرئيسية", "Keywords": "الكلمات المفتاحية",
  "Label": "التسمية", "Latitude": "خط العرض", "Light": "فاتح", "Link (# or URL)": "الرابط (# أو URL)",
  "Location": "الموقع", "Logo (dark backgrounds)": "الشعار (خلفيات داكنة)",
  "Logo (light backgrounds)": "الشعار (خلفيات فاتحة)", "Longitude": "خط الطول",
  "Maintenance mode": "وضع الصيانة", "Menu": "القائمة", "Menu key": "مفتاح القائمة", "Name": "الاسم",
  "Nationality": "الجنسية", "New tab": "علامة تبويب جديدة", "Note (where this is used)": "ملاحظة (أين تُستخدم)",
  "OG Description": "وصف OG", "OG Image": "صورة OG", "OG Title": "عنوان OG", "Occupation": "المهنة",
  "Open in": "الفتح في", "Order": "الترتيب", "Page key": "مفتاح الصفحة", "Page key (unique)": "مفتاح الصفحة (فريد)",
  "Person Name": "اسم الشخص", "Phone": "الهاتف", "Platform": "المنصة", "Play Store URL": "رابط Play Store",
  "Primary button URL": "رابط الزر الأساسي", "Primary button text": "نص الزر الأساسي",
  "Primary email": "البريد الإلكتروني الأساسي", "Primary photo": "الصورة الأساسية", "Problem": "المشكلة",
  "Proficiency": "مستوى الإتقان", "Proficiency (0-100)": "مستوى الإتقان (0-100)", "Project logo": "شعار المشروع",
  "Published": "منشور", "Question": "السؤال", "Rating": "التقييم", "Rating (1-5)": "التقييم (1-5)",
  "Related project": "المشروع المرتبط", "Role": "الدور", "SEO Description": "وصف السيو", "SEO Title": "عنوان السيو",
  "Same tab": "نفس علامة التبويب", "Secondary button URL": "رابط الزر الثانوي",
  "Secondary button text": "نص الزر الثانوي", "Secondary email": "البريد الإلكتروني الثانوي",
  "Secondary photo": "الصورة الثانوية", "Section key (unique)": "مفتاح القسم (فريد)",
  "Section visible": "القسم ظاهر", "Set as homepage": "تعيين كصفحة رئيسية", "Short Description": "وصف مختصر",
  "Short bio": "نبذة مختصرة", "Show About section": "إظهار قسم من أنا", "Show Experience section": "إظهار قسم الخبرة",
  "Show Projects section": "إظهار قسم المشاريع", "Show Services section": "إظهار قسم الخدمات",
  "Show Technologies section": "إظهار قسم التقنيات", "Show Testimonials section": "إظهار قسم آراء العملاء",
  "Show availability badge": "إظهار شارة التوفر", "Site URL": "رابط الموقع", "Site name": "اسم الموقع",
  "Slug": "المعرّف (Slug)", "Slug (leave blank to auto-generate)": "المعرّف (اتركه فارغًا للإنشاء التلقائي)",
  "Solution": "الحل", "Sort Order": "ترتيب الفرز", "Start": "البداية", "Start Date": "تاريخ البداية",
  "Start date": "تاريخ البداية", "Starting price": "السعر الابتدائي", "Status": "الحالة",
  "Subtitle": "العنوان الفرعي", "Suffix (e.g. +)": "اللاحقة (مثال: +)", "System": "النظام",
  "Telegram": "تيليجرام", "Template": "القالب", "Testimonial content": "نص رأي العميل",
  "Thumbnail": "صورة مصغرة", "Title": "العنوان", "Title — line 1": "العنوان — السطر 1",
  "Title — line 2 (accent color)": "العنوان — السطر 2 (لون مميز)", "Translation key (unique)": "مفتاح الترجمة (فريد)",
  "Type": "النوع", "Typical response time": "وقت الاستجابة المعتاد", "URL": "الرابط",
  "Username / handle": "اسم المستخدم", "Value": "القيمة", "Version": "الإصدار", "Video URL": "رابط الفيديو",
  "Video URL (optional)": "رابط الفيديو (اختياري)", "Visible": "ظاهر", "Visible on site": "ظاهر في الموقع",
  "Website URL": "رابط الموقع الإلكتروني", "WhatsApp": "واتساب", "Working hours": "ساعات العمل", "Year": "السنة",
  "Years experience": "سنوات الخبرة", "Years of experience": "سنوات الخبرة",
  "Slug (leave blank to auto-generate)": "المعرّف (اتركه فارغًا للإنشاء التلقائي)",
  "Client country": "بلد العميل", "Views": "المشاهدات", "Yes": "نعم", "No": "لا", "Hidden": "مخفي",
  "Editor": "محرر", "Active": "نشط", "Current": "حالي", "New": "جديدة", "Read": "مقروءة", "Replied": "تم الرد",
  "Spam": "مزعجة", "From": "من", "Subject": "الموضوع", "Received": "تاريخ الاستلام", "Joined": "تاريخ الانضمام",
  "Email": "البريد الإلكتروني", "Budget": "الميزانية", "Language": "اللغة", "Project type": "نوع المشروع",
  "Message": "الرسالة", "Categories": "الفئات",
};
function t(str) {
  if (LANG !== "ar" || !str) return str;
  return AR_STRINGS[str] || str;
}

/* ---------- toasts ---------- */
function toast(msg, type = "success") {
  const stack = $(".toast-stack") || (() => {
    const s = h(`<div class="toast-stack"></div>`);
    document.body.appendChild(s);
    return s;
  })();
  const el = h(`<div class="toast toast-${type}">${esc(msg)}</div>`);
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

/* ---------- modal ---------- */
function openModal({ title, bodyEl, footEl, size = "" }) {
  closeModal();
  const overlay = h(`
    <div class="modal-overlay" id="activeModal">
      <div class="modal ${size === "lg" ? "modal-lg" : ""}">
        <div class="modal-head">
          <h3>${esc(title)}</h3>
          <button class="btn-icon" id="modalCloseBtn">✕</button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-foot"></div>
      </div>
    </div>
  `);
  $(".modal-body", overlay).appendChild(bodyEl);
  if (footEl) $(".modal-foot", overlay).appendChild(footEl);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
  $("#modalCloseBtn", overlay).addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  return overlay;
}
function closeModal() {
  const m = $("#activeModal");
  if (m) { m.classList.remove("show"); setTimeout(() => m.remove(), 200); }
}

/* ---------- storage upload ---------- */
async function uploadFile(bucket, file, folder = "uploads") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${uid()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ============================================================
   FIELD BUILDERS — used by the generic form engine
============================================================ */
const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

function buildField(field, value) {
  const wrap = document.createElement("div");
  wrap.className = field.span2 ? "span-2" : "";
  const val = value ?? field.default ?? "";

  if (field.type === "i18n" || field.type === "i18n_textarea") {
    wrap.className += " span-2";
    const tabsId = `tabs-${uid()}`;
    const tabs = h(`<div class="lang-tabs" data-tabs="${tabsId}"></div>`);
    const panes = h(`<div class="i18n-field"></div>`);
    LANGS.forEach((lang, i) => {
      const tab = h(`<div class="lang-tab ${i === 0 ? "active" : ""}" data-lang="${lang.code}">${lang.label}</div>`);
      tabs.appendChild(tab);
      const v = (val && typeof val === "object" ? val[lang.code] : "") || "";
      const pane = h(`<div class="lang-pane ${i === 0 ? "active" : ""}" data-pane="${lang.code}"></div>`);
      const inputEl = field.type === "i18n_textarea"
        ? h(`<textarea data-lang-input="${lang.code}" placeholder="${esc(field.label)} (${lang.label})"></textarea>`)
        : h(`<input type="text" data-lang-input="${lang.code}" placeholder="${esc(field.label)} (${lang.label})">`);
      inputEl.value = v;
      pane.appendChild(inputEl);
      panes.appendChild(pane);
    });
    tabs.addEventListener("click", (e) => {
      const t = e.target.closest(".lang-tab");
      if (!t) return;
      $all(".lang-tab", tabs).forEach((x) => x.classList.remove("active"));
      $all(".lang-pane", panes).forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      $(`.lang-pane[data-pane="${t.dataset.lang}"]`, panes).classList.add("active");
    });
    const label = h(`<label style="display:block;font-size:.8rem;color:var(--text-dim);margin-bottom:6px;">${esc(t(field.label))}</label>`);
    wrap.appendChild(label);
    wrap.appendChild(tabs);
    wrap.appendChild(panes);
    wrap._getValue = () => {
      const out = {};
      LANGS.forEach((l) => { out[l.code] = $(`[data-lang-input="${l.code}"]`, panes).value.trim(); });
      return out;
    };
    return wrap;
  }

  if (field.type === "i18n_list") {
    // stores {en:[..], fr:[..], ar:[..]} — one line per item in a textarea
    wrap.className += " span-2";
    const tabs = h(`<div class="lang-tabs"></div>`);
    const panes = h(`<div class="i18n-field"></div>`);
    LANGS.forEach((lang, i) => {
      const tab = h(`<div class="lang-tab ${i === 0 ? "active" : ""}" data-lang="${lang.code}">${lang.label}</div>`);
      tabs.appendChild(tab);
      const arr = (val && val[lang.code]) || [];
      const pane = h(`<div class="lang-pane ${i === 0 ? "active" : ""}" data-pane="${lang.code}"></div>`);
      const ta = h(`<textarea data-lang-input="${lang.code}" placeholder="${tf("One item per line", "سطر واحد لكل عنصر")}"></textarea>`);
      ta.value = arr.join("\n");
      pane.appendChild(ta);
      panes.appendChild(pane);
    });
    tabs.addEventListener("click", (e) => {
      const t = e.target.closest(".lang-tab");
      if (!t) return;
      $all(".lang-tab", tabs).forEach((x) => x.classList.remove("active"));
      $all(".lang-pane", panes).forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      $(`.lang-pane[data-pane="${t.dataset.lang}"]`, panes).classList.add("active");
    });
    const label = h(`<label style="display:block;font-size:.8rem;color:var(--text-dim);margin-bottom:6px;">${esc(t(field.label))} <span class="text-dim">${tf("(one per line)", "(سطر لكل عنصر)")}</span></label>`);
    wrap.appendChild(label);
    wrap.appendChild(tabs);
    wrap.appendChild(panes);
    wrap._getValue = () => {
      const out = {};
      LANGS.forEach((l) => {
        out[l.code] = $(`[data-lang-input="${l.code}"]`, panes).value.split("\n").map((s) => s.trim()).filter(Boolean);
      });
      return out;
    };
    return wrap;
  }

  const label = h(`<label style="display:block;font-size:.8rem;color:var(--text-dim);margin-bottom:6px;">${esc(t(field.label))}</label>`);
  wrap.appendChild(label);

  if (field.type === "textarea") {
    const el = h(`<textarea placeholder="${esc(field.placeholder || "")}"></textarea>`);
    el.value = val || "";
    wrap.appendChild(el);
    wrap._getValue = () => el.value;
    return wrap;
  }

  if (field.type === "boolean") {
    wrap.innerHTML = "";
    const row = h(`
      <div class="checkbox-row">
        <input type="checkbox" id="chk-${uid()}">
        <label></label>
      </div>
    `);
    const input = $("input", row);
    input.checked = !!val;
    $("label", row).textContent = t(field.label);
    $("label", row).setAttribute("for", input.id);
    wrap.appendChild(row);
    wrap._getValue = () => input.checked;
    return wrap;
  }

  if (field.type === "select") {
    const el = document.createElement("select");
    (field.options || []).forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value; o.textContent = t(opt.label);
      if (String(opt.value) === String(val)) o.selected = true;
      el.appendChild(o);
    });
    wrap.appendChild(el);
    wrap._getValue = () => el.value;
    return wrap;
  }

  if (field.type === "async_select") {
    const el = document.createElement("select");
    el.innerHTML = `<option value="">${tf("Loading…", "جارٍ التحميل…")}</option>`;
    wrap.appendChild(el);
    field.loadOptions().then((opts) => {
      el.innerHTML = `<option value="">${tf("— none —", "— بلا —")}</option>`;
      opts.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value; o.textContent = opt.label;
        if (String(opt.value) === String(val)) o.selected = true;
        el.appendChild(o);
      });
    });
    wrap._getValue = () => el.value || null;
    return wrap;
  }

  if (field.type === "chip_multiselect") {
    const box = h(`<div class="chip-select"></div>`);
    const selected = new Set(Array.isArray(val) ? val.map(String) : []);
    wrap.appendChild(box);
    field.loadOptions().then((opts) => {
      box.innerHTML = "";
      opts.forEach((opt) => {
        const checked = selected.has(String(opt.value));
        const chip = h(`
          <label class="chip-option ${checked ? "checked" : ""}">
            <input type="checkbox" value="${esc(opt.value)}" ${checked ? "checked" : ""}>
            ${esc(opt.label)}
          </label>
        `);
        $("input", chip).addEventListener("change", (e) => {
          chip.classList.toggle("checked", e.target.checked);
        });
        box.appendChild(chip);
      });
    });
    wrap._getValue = () => $all("input:checked", box).map((i) => i.value);
    return wrap;
  }

  if (field.type === "image" || field.type === "file") {
    const bucket = field.bucket || BUCKET_PORTFOLIO;
    const box = h(`
      <div class="upload-box">
        ${field.type === "image" ? `<img class="upload-preview" src="${val || ""}" onerror="this.style.opacity=0">` : ""}
        <div class="upload-info">
          <input type="file" accept="${field.type === "image" ? "image/*" : "*"}">
          <small class="current-url">${val ? esc(val) : tf("No file uploaded yet", "لم يُرفع أي ملف بعد")}</small>
        </div>
        <button type="button" class="btn btn-outline btn-sm" ${!val ? "disabled" : ""}>${tf("Clear", "مسح")}</button>
      </div>
    `);
    let currentUrl = val || "";
    const fileInput = $("input[type=file]", box);
    const small = $(".current-url", box);
    const clearBtn = $("button", box);
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      small.textContent = tf("Uploading…", "جارٍ الرفع…");
      try {
        currentUrl = await uploadFile(bucket, file, field.folder || "uploads");
        small.textContent = currentUrl;
        clearBtn.disabled = false;
        const img = $("img", box);
        if (img) img.src = currentUrl;
        toast(tf("File uploaded", "تم رفع الملف"));
      } catch (err) {
        toast(tf("Upload failed: ", "فشل الرفع: ") + err.message, "error");
        small.textContent = currentUrl || tf("No file uploaded yet", "لم يُرفع أي ملف بعد");
      }
    });
    clearBtn.addEventListener("click", () => {
      currentUrl = "";
      small.textContent = tf("No file uploaded yet", "لم يُرفع أي ملف بعد");
      clearBtn.disabled = true;
      const img = $("img", box);
      if (img) img.style.opacity = 0;
    });
    wrap.appendChild(box);
    wrap._getValue = () => currentUrl;
    return wrap;
  }

  if (field.type === "date") {
    const el = h(`<input type="date">`);
    el.value = val ? String(val).slice(0, 10) : "";
    wrap.appendChild(el);
    wrap._getValue = () => el.value || null;
    return wrap;
  }

  if (field.type === "number") {
    const el = h(`<input type="number" step="${field.step || 1}">`);
    el.value = val ?? "";
    wrap.appendChild(el);
    wrap._getValue = () => (el.value === "" ? null : Number(el.value));
    return wrap;
  }

  if (field.type === "color") {
    const el = h(`<input type="color" style="height:42px;padding:4px;">`);
    el.value = val || "#e0a526";
    wrap.appendChild(el);
    wrap._getValue = () => el.value;
    return wrap;
  }

  // default: plain text
  const el = h(`<input type="text" placeholder="${esc(field.placeholder || "")}">`);
  el.value = val ?? "";
  wrap.appendChild(el);
  wrap._getValue = () => el.value;
  return wrap;
}

function buildForm(fields, existingRow = {}) {
  const form = h(`<div class="form-grid"></div>`);
  const getters = {};
  fields.forEach((field) => {
    const fieldWrap = buildField(field, existingRow[field.key]);
    getters[field.key] = () => fieldWrap._getValue();
    form.appendChild(fieldWrap);
  });
  return {
    el: form,
    getData() {
      const out = {};
      for (const key in getters) out[key] = getters[key]();
      return out;
    },
  };
}

/* ============================================================
   NAV DEFINITION
============================================================ */
const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  hero: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>`,
  about: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`,
  stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  services: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/></svg>`,
  tech: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  cap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>`,
  award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M8.7 13.6 7 22l5-3 5 3-1.7-8.4"/></svg>`,
  quote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h5v5a5 5 0 0 1-5 5"/><path d="M14 7h5v5a5 5 0 0 1-5 5"/></svg>`,
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 8 12 14 22 8 12 2"/><polyline points="2 16 12 22 22 16"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  nav: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  social: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><polyline points="22 6 12 13 2 6"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  contact: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
};

const NAV = [
  { group: "Overview", items: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  ]},
  { group: "Content", items: [
    { key: "hero", label: "Hero Section", icon: "hero" },
    { key: "about", label: "About Section", icon: "about" },
    { key: "statistics", label: "Statistics", icon: "stats" },
    { key: "services", label: "Services", icon: "services" },
    { key: "tech_categories", label: "Tech Categories", icon: "layers" },
    { key: "technologies", label: "Technologies", icon: "tech" },
    { key: "project_categories", label: "Project Categories", icon: "layers" },
    { key: "projects", label: "Projects", icon: "folder" },
    { key: "experiences", label: "Experience", icon: "briefcase" },
    { key: "education", label: "Education", icon: "cap" },
    { key: "certificates", label: "Certificates", icon: "award" },
    { key: "testimonials", label: "Testimonials", icon: "quote" },
    { key: "faqs", label: "FAQs", icon: "help" },
    { key: "custom_sections", label: "Custom Sections", icon: "layers" },
    { key: "pages", label: "Pages", icon: "file" },
  ]},
  { group: "Site", items: [
    { key: "site_settings", label: "Site Settings", icon: "settings" },
    { key: "seo_settings", label: "SEO", icon: "search" },
    { key: "navigation_items", label: "Navigation", icon: "nav" },
    { key: "social_links", label: "Social Links", icon: "social" },
    { key: "external_links", label: "External Links", icon: "link" },
    { key: "downloads", label: "Downloads", icon: "download" },
    { key: "translations", label: "Translations", icon: "globe" },
  ]},
  { group: "Inbox", items: [
    { key: "messages", label: "Messages", icon: "mail", countKey: "unreadMessages" },
    { key: "contact_info", label: "Contact Info", icon: "contact" },
  ]},
  { group: "Admin", items: [
    { key: "users", label: "Users", icon: "users", adminOnly: true },
  ]},
];

/* ============================================================
   GENERIC TABLE SCHEMAS
   Each entry describes a Supabase table well enough for the
   generic list + form engine to manage full CRUD on it.
============================================================ */
const SCHEMAS = {
  statistics: {
    table: "statistics", title: "Statistics", singular: "Statistic",
    orderBy: "sort_order",
    listCols: [
      { key: "label", label: "Label", render: (r) => i18nPreview(r.label) },
      { key: "value", label: "Value", render: (r) => `${r.value}${r.suffix || ""}` },
      { key: "sort_order", label: "Order" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "label", type: "i18n", label: "Label" },
      { key: "value", type: "text", label: "Value" },
      { key: "suffix", type: "text", label: "Suffix (e.g. +)" },
      { key: "icon", type: "text", label: "Icon key" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  tech_categories: {
    table: "technology_categories", title: "Technology Categories", singular: "Category",
    orderBy: "sort_order",
    listCols: [
      { key: "name", label: "Name", render: (r) => i18nPreview(r.name) },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "Order" },
    ],
    fields: [
      { key: "slug", type: "text", label: "Slug", placeholder: "frontend" },
      { key: "name", type: "i18n", label: "Name" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
    ],
  },

  technologies: {
    table: "technologies", title: "Technologies", singular: "Technology",
    orderBy: "sort_order",
    listCols: [
      { key: "icon_url", label: "", render: (r) => r.icon_url ? `<img class="cell-thumb" src="${esc(r.icon_url)}">` : "" },
      { key: "name", label: "Name", render: (r) => `<span class="cell-title">${esc(r.name)}</span>` },
      { key: "slug", label: "Slug" },
      { key: "proficiency", label: "Proficiency", render: (r) => r.proficiency != null ? `${r.proficiency}%` : "—" },
      { key: "featured", label: "Featured", render: (r) => r.featured ? `<span class="badge badge-gold">${t("Featured")}</span>` : "" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "slug", type: "text", label: "Slug", placeholder: "flutter" },
      { key: "name", type: "text", label: "Name", placeholder: "Flutter" },
      { key: "category_id", type: "async_select", label: "Category", loadOptions: () => loadOptions("technology_categories", "id", "name") },
      { key: "icon_url", type: "image", label: "Icon Image (optional)", folder: "tech-icons" },
      { key: "icon_key", type: "text", label: "Icon key (devicon-style, used if no image)" },
      { key: "website_url", type: "text", label: "Website URL" },
      { key: "proficiency", type: "number", label: "Proficiency (0-100)" },
      { key: "years_experience", type: "number", label: "Years experience", step: "0.1" },
      { key: "featured", type: "boolean", label: "Featured", default: false },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  project_categories: {
    table: "project_categories", title: "Project Categories", singular: "Category",
    orderBy: "sort_order",
    listCols: [
      { key: "name", label: "Name", render: (r) => i18nPreview(r.name) },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "Order" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "slug", type: "text", label: "Slug", placeholder: "mobile" },
      { key: "name", type: "i18n", label: "Name" },
      { key: "description", type: "i18n_textarea", label: "Description" },
      { key: "icon", type: "text", label: "Icon key" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  services: {
    table: "services", title: "Services", singular: "Service",
    orderBy: "sort_order",
    listCols: [
      { key: "title", label: "Title", render: (r) => `<span class="cell-title">${esc(i18nPreview(r.title))}</span>` },
      { key: "slug", label: "Slug" },
      { key: "featured", label: "Featured", render: (r) => r.featured ? `<span class="badge badge-gold">${t("Featured")}</span>` : "" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "slug", type: "text", label: "Slug", placeholder: "mobile-development" },
      { key: "title", type: "i18n", label: "Title" },
      { key: "short_description", type: "i18n_textarea", label: "Short Description" },
      { key: "full_description", type: "i18n_textarea", label: "Full Description" },
      { key: "features", type: "i18n_list", label: "Feature bullets" },
      { key: "icon", type: "text", label: "Icon key" },
      { key: "icon_url", type: "image", label: "Icon image (optional)", folder: "service-icons" },
      { key: "image_url", type: "image", label: "Cover image (optional)", folder: "services" },
      { key: "price_from", type: "number", label: "Starting price", step: "0.01" },
      { key: "currency", type: "text", label: "Currency", default: "USD" },
      { key: "button_text", type: "i18n", label: "Button Text" },
      { key: "button_url", type: "text", label: "Button URL" },
      { key: "featured", type: "boolean", label: "Featured", default: false },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  experiences: {
    table: "experiences", title: "Experience", singular: "Experience",
    orderBy: "sort_order",
    listCols: [
      { key: "job_title", label: "Role", render: (r) => `<span class="cell-title">${esc(i18nPreview(r.job_title))}</span><div class="cell-sub">${esc(r.company_name || "")}</div>` },
      { key: "start_date", label: "Start", render: (r) => fmtDate(r.start_date) },
      { key: "end_date", label: "End", render: (r) => r.currently_working ? `<span class="badge badge-green">${t("Current")}</span>` : fmtDate(r.end_date) },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "company_name", type: "text", label: "Company name" },
      { key: "company_url", type: "text", label: "Company URL" },
      { key: "company_logo_url", type: "image", label: "Company logo", folder: "companies" },
      { key: "job_title", type: "i18n", label: "Job Title" },
      { key: "description", type: "i18n_textarea", label: "Description" },
      { key: "location", type: "i18n", label: "Location" },
      { key: "employment_type", type: "text", label: "Employment type (e.g. Full-time, Freelance)" },
      { key: "start_date", type: "date", label: "Start Date" },
      { key: "end_date", type: "date", label: "End Date" },
      { key: "currently_working", type: "boolean", label: "Currently working here", default: false },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  education: {
    table: "education", title: "Education", singular: "Education entry",
    orderBy: "sort_order",
    listCols: [
      { key: "institution_name", label: "Institution", render: (r) => `<span class="cell-title">${esc(i18nPreview(r.institution_name))}</span><div class="cell-sub">${esc(i18nPreview(r.degree))}</div>` },
      { key: "start_date", label: "Start", render: (r) => fmtDate(r.start_date) },
      { key: "end_date", label: "End", render: (r) => fmtDate(r.end_date) },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "institution_name", type: "i18n", label: "Institution Name" },
      { key: "degree", type: "i18n", label: "Degree" },
      { key: "field_of_study", type: "i18n", label: "Field of Study" },
      { key: "description", type: "i18n_textarea", label: "Description" },
      { key: "institution_logo_url", type: "image", label: "Institution logo", folder: "institutions" },
      { key: "start_date", type: "date", label: "Start Date" },
      { key: "end_date", type: "date", label: "End Date" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  certificates: {
    table: "certificates", title: "Certificates", singular: "Certificate",
    orderBy: "sort_order",
    listCols: [
      { key: "title", label: "Title", render: (r) => `<span class="cell-title">${esc(i18nPreview(r.title))}</span><div class="cell-sub">${esc(r.organization || "")}</div>` },
      { key: "issue_date", label: "Issued", render: (r) => fmtDate(r.issue_date) },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "title", type: "i18n", label: "Title" },
      { key: "organization", type: "text", label: "Issuing organization" },
      { key: "certificate_url", type: "text", label: "Certificate verification URL" },
      { key: "certificate_image_url", type: "image", label: "Certificate image", folder: "certificates" },
      { key: "credential_id", type: "text", label: "Credential ID" },
      { key: "issue_date", type: "date", label: "Issue Date" },
      { key: "expiry_date", type: "date", label: "Expiry Date" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  testimonials: {
    table: "testimonials", title: "Testimonials", singular: "Testimonial",
    orderBy: "sort_order",
    listCols: [
      { key: "avatar_url", label: "", render: (r) => r.avatar_url ? `<img class="cell-thumb" src="${esc(r.avatar_url)}">` : "" },
      { key: "person_name", label: "Name", render: (r) => `<span class="cell-title">${esc(r.person_name)}</span><div class="cell-sub">${esc(r.company || "")}</div>` },
      { key: "rating", label: "Rating", render: (r) => "★".repeat(r.rating || 0) },
      { key: "featured", label: "Featured", render: (r) => r.featured ? `<span class="badge badge-gold">${t("Featured")}</span>` : "" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "person_name", type: "text", label: "Person Name" },
      { key: "person_job", type: "i18n", label: "Job Title" },
      { key: "company", type: "text", label: "Company" },
      { key: "avatar_url", type: "image", label: "Avatar", folder: "avatars" },
      { key: "content", type: "i18n_textarea", label: "Testimonial content" },
      { key: "rating", type: "number", label: "Rating (1-5)", default: 5 },
      { key: "project_id", type: "async_select", label: "Related project", loadOptions: () => loadOptions("projects", "id", "slug") },
      { key: "featured", type: "boolean", label: "Featured", default: false },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  faqs: {
    table: "faqs", title: "FAQs", singular: "FAQ",
    orderBy: "sort_order",
    listCols: [
      { key: "question", label: "Question", render: (r) => i18nPreview(r.question) },
      { key: "sort_order", label: "Order" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "question", type: "i18n", label: "Question" },
      { key: "answer", type: "i18n_textarea", label: "Answer" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  custom_sections: {
    table: "custom_sections", title: "Custom Sections", singular: "Section",
    orderBy: "sort_order",
    listCols: [
      { key: "title", label: "Title", render: (r) => `<span class="cell-title">${esc(i18nPreview(r.title))}</span><div class="cell-sub">${esc(r.section_key)}</div>` },
      { key: "section_type", label: "Type" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "section_key", type: "text", label: "Section key (unique)", placeholder: "why-work-with-me" },
      { key: "section_type", type: "text", label: "Type", placeholder: "content" },
      { key: "eyebrow", type: "i18n", label: "Eyebrow" },
      { key: "title", type: "i18n", label: "Title" },
      { key: "subtitle", type: "i18n", label: "Subtitle" },
      { key: "content", type: "i18n_textarea", label: "Content" },
      { key: "image_url", type: "image", label: "Image", folder: "custom-sections" },
      { key: "background_image_url", type: "image", label: "Background image", folder: "custom-sections" },
      { key: "button_text", type: "i18n", label: "Button Text" },
      { key: "button_url", type: "text", label: "Button URL" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  pages: {
    table: "pages", title: "Pages", singular: "Page",
    orderBy: "sort_order",
    listCols: [
      { key: "title", label: "Title", render: (r) => `<span class="cell-title">${esc(i18nPreview(r.title))}</span><div class="cell-sub">/${esc(r.slug)}</div>` },
      { key: "is_homepage", label: "Homepage", render: (r) => r.is_homepage ? `<span class="badge badge-gold">${t("Homepage")}</span>` : "" },
      { key: "is_published", label: "Status", render: (r) => r.is_published ? `<span class="badge badge-green">${t("Published")}</span>` : `<span class="badge badge-gray">${t("Draft")}</span>` },
    ],
    fields: [
      { key: "slug", type: "text", label: "Slug" },
      { key: "title", type: "i18n", label: "Title" },
      { key: "description", type: "i18n_textarea", label: "Description" },
      { key: "content", type: "i18n_textarea", label: "Content" },
      { key: "template", type: "text", label: "Template", default: "default" },
      { key: "cover_image_url", type: "image", label: "Cover image", folder: "pages" },
      { key: "seo_title", type: "i18n", label: "SEO Title" },
      { key: "seo_description", type: "i18n_textarea", label: "SEO Description" },
      { key: "is_homepage", type: "boolean", label: "Set as homepage", default: false },
      { key: "is_published", type: "boolean", label: "Published", default: true },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
    ],
  },

  downloads: {
    table: "downloads", title: "Downloads", singular: "File",
    orderBy: "sort_order",
    listCols: [
      { key: "title", label: "Title", render: (r) => i18nPreview(r.title) },
      { key: "file_type", label: "Type" },
      { key: "version", label: "Version" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "title", type: "i18n", label: "Title" },
      { key: "file_type", type: "text", label: "File type", placeholder: "pdf" },
      { key: "file_url", type: "file", label: "File", bucket: "documents", folder: "downloads" },
      { key: "version", type: "text", label: "Version" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  external_links: {
    table: "external_links", title: "External Links", singular: "Link",
    orderBy: "sort_order",
    listCols: [
      { key: "title", label: "Title", render: (r) => i18nPreview(r.title) },
      { key: "key", label: "Key" },
      { key: "url", label: "URL" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "key", type: "text", label: "Key (unique)" },
      { key: "title", type: "i18n", label: "Title" },
      { key: "url", type: "text", label: "URL" },
      { key: "icon", type: "text", label: "Icon key" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  navigation_items: {
    table: "navigation_items", title: "Navigation", singular: "Menu item",
    orderBy: "sort_order",
    listCols: [
      { key: "label", label: "Label", render: (r) => i18nPreview(r.label) },
      { key: "href", label: "Link" },
      { key: "menu_key", label: "Menu" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "menu_key", type: "text", label: "Menu key", default: "main" },
      { key: "label", type: "i18n", label: "Label" },
      { key: "href", type: "text", label: "Link (# or URL)" },
      { key: "icon", type: "text", label: "Icon key" },
      { key: "target", type: "select", label: "Open in", options: [{ value: "_self", label: "Same tab" }, { value: "_blank", label: "New tab" }] },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  social_links: {
    table: "social_links", title: "Social Links", singular: "Social link",
    orderBy: "sort_order",
    listCols: [
      { key: "platform", label: "Platform", render: (r) => `<span class="cell-title">${esc(r.platform)}</span>` },
      { key: "url", label: "URL" },
      { key: "is_visible", label: "Visible", render: (r) => visBadge(r.is_visible) },
    ],
    fields: [
      { key: "platform", type: "text", label: "Platform", placeholder: "LinkedIn" },
      { key: "username", type: "text", label: "Username / handle" },
      { key: "url", type: "text", label: "URL" },
      { key: "icon", type: "text", label: "Icon key" },
      { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
      { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
    ],
  },

  seo_settings: {
    table: "seo_settings", title: "SEO Settings", singular: "Page SEO",
    orderBy: "id",
    listCols: [
      { key: "page_key", label: "Page key", render: (r) => `<span class="cell-title">${esc(r.page_key)}</span>` },
      { key: "title", label: "Title", render: (r) => i18nPreview(r.title) },
      { key: "robots_index", label: "Indexed", render: (r) => r.robots_index ? `<span class="badge badge-green">${t("Yes")}</span>` : `<span class="badge badge-red">${t("No")}</span>` },
    ],
    fields: [
      { key: "page_key", type: "text", label: "Page key (unique)", placeholder: "home" },
      { key: "title", type: "i18n", label: "SEO Title" },
      { key: "description", type: "i18n_textarea", label: "SEO Description" },
      { key: "keywords", type: "i18n", label: "Keywords" },
      { key: "og_title", type: "i18n", label: "OG Title" },
      { key: "og_description", type: "i18n_textarea", label: "OG Description" },
      { key: "og_image_url", type: "image", label: "OG Image", folder: "seo" },
      { key: "canonical_url", type: "text", label: "Canonical URL" },
      { key: "robots_index", type: "boolean", label: "Allow indexing", default: true },
      { key: "robots_follow", type: "boolean", label: "Allow following links", default: true },
    ],
  },

  translations: {
    table: "translations", title: "Translations", singular: "Translation",
    orderBy: "translation_key",
    listCols: [
      { key: "translation_key", label: "Key", render: (r) => `<span class="cell-title">${esc(r.translation_key)}</span>` },
      { key: "en", label: "EN" },
      { key: "fr", label: "FR" },
      { key: "ar", label: "AR" },
    ],
    fields: [
      { key: "translation_key", type: "text", label: "Translation key (unique)" },
      { key: "en", type: "text", label: "English" },
      { key: "fr", type: "text", label: "French" },
      { key: "ar", type: "text", label: "Arabic" },
      { key: "description", type: "text", label: "Note (where this is used)" },
    ],
  },
};

function visBadge(v) {
  return v ? `<span class="badge badge-green">${t("Visible")}</span>` : `<span class="badge badge-gray">${t("Hidden")}</span>`;
}

async function loadOptions(table, valueKey, labelKey) {
  const { data, error } = await sb.from(table).select("*").order(labelKey, { ascending: true });
  if (error) { console.error(error); return []; }
  return data.map((row) => ({ value: row[valueKey], label: typeof row[labelKey] === "object" ? i18nPreview(row[labelKey]) : row[labelKey] }));
}

/* ============================================================
   GENERIC CRUD RENDERER
============================================================ */
async function renderGenericCRUD(container, schemaKey) {
  const schema = SCHEMAS[schemaKey];
  container.innerHTML = `
    <div class="topbar">
      <div>
        <h1>${esc(t(schema.title))}</h1>
        <div class="topbar-sub">${tf(`Manage every ${schema.singular.toLowerCase()} shown on the site`, `إدارة كل ${t(schema.singular)} يظهر في الموقع`)}</div>
      </div>
      <button class="btn btn-primary" id="addNewBtn">${tf(`+ New ${schema.singular}`, `+ ${t(schema.singular)} جديد`)}</button>
    </div>
    <div class="content">
      <div class="panel">
        <div class="table-wrap" id="tableWrap"><div class="loading-row"><div class="spinner"></div>${tf("Loading…", "جارٍ التحميل…")}</div></div>
      </div>
    </div>
  `;
  $("#addNewBtn", container).addEventListener("click", () => openRecordForm(schemaKey, null, () => renderGenericCRUD(container, schemaKey)));

  const { data, error } = await sb.from(schema.table).select("*").order(schema.orderBy, { ascending: true, nullsFirst: false });
  const wrap = $("#tableWrap", container);
  if (error) { wrap.innerHTML = `<div class="empty-state">${tf("Couldn't load data: ", "تعذّر تحميل البيانات: ")}${esc(error.message)}</div>`; return; }
  if (!data.length) { wrap.innerHTML = `<div class="empty-state">${tf(`No ${schema.title.toLowerCase()} yet. Click "New ${schema.singular}" to add the first one.`, `لا توجد عناصر في "${t(schema.title)}" بعد. اضغط على "${t(schema.singular)} جديد" لإضافة أول عنصر.`)}</div>`; return; }

  const table = h(`
    <table class="data-table">
      <thead><tr>${schema.listCols.map((c) => `<th>${esc(t(c.label))}</th>`).join("")}<th></th></tr></thead>
      <tbody></tbody>
    </table>
  `);
  const tbody = $("tbody", table);
  data.forEach((row) => {
    const tr = h(`<tr></tr>`);
    schema.listCols.forEach((c) => {
      const td = document.createElement("td");
      td.innerHTML = c.render ? c.render(row) : esc(row[c.key] ?? "—");
      tr.appendChild(td);
    });
    const actionsTd = h(`
      <td>
        <div class="row-actions">
          <button class="btn-icon edit-btn" title="${tf("Edit", "تعديل")}">✎</button>
          <button class="btn-icon del-btn" title="${tf("Delete", "حذف")}">🗑</button>
        </div>
      </td>
    `);
    $(".edit-btn", actionsTd).addEventListener("click", () => openRecordForm(schemaKey, row, () => renderGenericCRUD(container, schemaKey)));
    $(".del-btn", actionsTd).addEventListener("click", () => confirmDelete(schema, row, () => renderGenericCRUD(container, schemaKey)));
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });
  wrap.innerHTML = "";
  wrap.appendChild(table);
}

function openRecordForm(schemaKey, existingRow, onSaved) {
  const schema = SCHEMAS[schemaKey];
  const form = buildForm(schema.fields, existingRow || {});
  const foot = h(`
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn btn-outline" id="cancelBtn">${tf("Cancel", "إلغاء")}</button>
      <button class="btn btn-primary" id="saveBtn">${existingRow ? tf("Save Changes", "حفظ التغييرات") : tf("Create", "إنشاء")}</button>
    </div>
  `);
  openModal({
    title: existingRow ? tf(`Edit ${schema.singular}`, `تعديل ${t(schema.singular)}`) : tf(`New ${schema.singular}`, `${t(schema.singular)} جديد`),
    bodyEl: form.el,
    footEl: foot,
    size: "lg",
  });
  $("#cancelBtn", foot).addEventListener("click", closeModal);
  $("#saveBtn", foot).addEventListener("click", async () => {
    const btn = $("#saveBtn", foot);
    btn.disabled = true; btn.textContent = tf("Saving…", "جارٍ الحفظ…");
    try {
      const payload = form.getData();
      let error;
      if (existingRow) {
        ({ error } = await sb.from(schema.table).update(payload).eq("id", existingRow.id));
      } else {
        ({ error } = await sb.from(schema.table).insert(payload));
      }
      if (error) throw error;
      toast(tf(`${schema.singular} saved`, `تم حفظ ${t(schema.singular)}`));
      closeModal();
      onSaved && onSaved();
    } catch (err) {
      toast(tf("Save failed: ", "فشل الحفظ: ") + err.message, "error");
      btn.disabled = false; btn.textContent = existingRow ? tf("Save Changes", "حفظ التغييرات") : tf("Create", "إنشاء");
    }
  });
}

function confirmDelete(schema, row, onDeleted) {
  const body = h(`<p>${tf(`Delete this ${schema.singular.toLowerCase()}? This cannot be undone.`, `هل تريد حذف ${t(schema.singular)}؟ لا يمكن التراجع عن هذا الإجراء.`)}</p>`);
  const foot = h(`
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn btn-outline" id="cancelDel">${tf("Cancel", "إلغاء")}</button>
      <button class="btn btn-danger" id="confirmDel">${tf("Delete", "حذف")}</button>
    </div>
  `);
  openModal({ title: tf("Confirm deletion", "تأكيد الحذف"), bodyEl: body, footEl: foot });
  $("#cancelDel", foot).addEventListener("click", closeModal);
  $("#confirmDel", foot).addEventListener("click", async () => {
    const { error } = await sb.from(schema.table).delete().eq("id", row.id);
    if (error) { toast(tf("Delete failed: ", "فشل الحذف: ") + error.message, "error"); return; }
    toast(tf(`${schema.singular} deleted`, `تم حذف ${t(schema.singular)}`));
    closeModal();
    onDeleted && onDeleted();
  });
}

/* ============================================================
   SINGLETON MODULES (one row per table)
============================================================ */
const SINGLETONS = {
  hero: {
    table: "hero_section", title: "Hero Section",
    subtitle: "The first thing visitors see on your homepage",
    fields: [
      { key: "availability_enabled", type: "boolean", label: "Show availability badge", default: true },
      { key: "availability_text", type: "i18n", label: "Availability text" },
      { key: "title_line_1", type: "i18n", label: "Title — line 1" },
      { key: "title_line_2", type: "i18n", label: "Title — line 2 (accent color)" },
      { key: "description", type: "i18n_textarea", label: "Description" },
      { key: "primary_button_text", type: "i18n", label: "Primary button text" },
      { key: "primary_button_url", type: "text", label: "Primary button URL" },
      { key: "secondary_button_text", type: "i18n", label: "Secondary button text" },
      { key: "secondary_button_url", type: "text", label: "Secondary button URL" },
      { key: "cv_url", type: "file", label: "CV file (PDF)", bucket: "documents", folder: "cv" },
      { key: "image_url", type: "image", label: "Hero image (desktop)", folder: "hero" },
      { key: "mobile_image_url", type: "image", label: "Hero image (mobile)", folder: "hero" },
      { key: "video_url", type: "text", label: "Video URL (optional)" },
      { key: "badge_text", type: "i18n", label: "Badge text (optional)" },
      { key: "code_title", type: "text", label: "Code window title" },
      { key: "code_content", type: "textarea", label: "Code snippet shown in the hero" },
      { key: "is_visible", type: "boolean", label: "Section visible", default: true },
    ],
  },
  about: {
    table: "about_section", title: "About Section",
    subtitle: "Your story, shown on the homepage",
    fields: [
      { key: "eyebrow", type: "i18n", label: "Eyebrow" },
      { key: "heading_prefix", type: "i18n", label: "Heading prefix (e.g. \"I am\")" },
      { key: "name", type: "i18n", label: "Name" },
      { key: "short_bio", type: "i18n_textarea", label: "Short bio" },
      { key: "full_bio", type: "i18n_textarea", label: "Full bio" },
      { key: "image_url", type: "image", label: "Primary photo", folder: "about" },
      { key: "secondary_image_url", type: "image", label: "Secondary photo", folder: "about" },
      { key: "button_text", type: "i18n", label: "Button text" },
      { key: "button_url", type: "text", label: "Button URL" },
      { key: "location", type: "i18n", label: "Location" },
      { key: "nationality", type: "i18n", label: "Nationality" },
      { key: "occupation", type: "i18n", label: "Occupation" },
      { key: "years_experience", type: "number", label: "Years of experience" },
      { key: "is_visible", type: "boolean", label: "Section visible", default: true },
    ],
  },
  contact_info: {
    table: "contact_info", title: "Contact Info",
    subtitle: "Contact details shown in the footer / contact section",
    fields: [
      { key: "email", type: "text", label: "Primary email" },
      { key: "secondary_email", type: "text", label: "Secondary email" },
      { key: "phone", type: "text", label: "Phone" },
      { key: "whatsapp", type: "text", label: "WhatsApp" },
      { key: "telegram", type: "text", label: "Telegram" },
      { key: "address", type: "i18n", label: "Address" },
      { key: "city", type: "i18n", label: "City" },
      { key: "country", type: "i18n", label: "Country" },
      { key: "latitude", type: "number", label: "Latitude", step: "0.0000001" },
      { key: "longitude", type: "number", label: "Longitude", step: "0.0000001" },
      { key: "working_hours", type: "i18n", label: "Working hours" },
      { key: "contact_heading", type: "i18n", label: "Contact heading" },
      { key: "contact_description", type: "i18n_textarea", label: "Contact description" },
      { key: "response_time", type: "i18n", label: "Typical response time" },
      { key: "is_available", type: "boolean", label: "Currently available for work", default: true },
    ],
  },
  site_settings: {
    table: "site_settings", title: "Site Settings",
    subtitle: "Global configuration for the whole website",
    fields: [
      { key: "site_name", type: "text", label: "Site name" },
      { key: "site_url", type: "text", label: "Site URL" },
      { key: "logo_url", type: "image", label: "Logo (light backgrounds)", folder: "branding" },
      { key: "logo_dark_url", type: "image", label: "Logo (dark backgrounds)", folder: "branding" },
      { key: "favicon_url", type: "image", label: "Favicon", folder: "branding" },
      { key: "default_language", type: "select", label: "Default language", options: [{ value: "en", label: "English" }, { value: "fr", label: "French" }, { value: "ar", label: "Arabic" }] },
      { key: "default_theme", type: "select", label: "Default theme", options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }] },
      { key: "maintenance_mode", type: "boolean", label: "Maintenance mode", default: false },
      { key: "enable_contact_form", type: "boolean", label: "Enable contact form", default: true },
      { key: "enable_projects", type: "boolean", label: "Show Projects section", default: true },
      { key: "enable_services", type: "boolean", label: "Show Services section", default: true },
      { key: "enable_about", type: "boolean", label: "Show About section", default: true },
      { key: "enable_technologies", type: "boolean", label: "Show Technologies section", default: true },
      { key: "enable_experience", type: "boolean", label: "Show Experience section", default: true },
      { key: "enable_testimonials", type: "boolean", label: "Show Testimonials section", default: true },
      { key: "footer_text", type: "i18n_textarea", label: "Footer text" },
      { key: "copyright_text", type: "i18n_textarea", label: "Copyright text" },
      { key: "custom_css", type: "textarea", label: "Custom CSS (advanced)" },
      { key: "custom_js", type: "textarea", label: "Custom JS (advanced)" },
    ],
  },
};

async function renderSingleton(container, key) {
  const cfg = SINGLETONS[key];
  container.innerHTML = `
    <div class="topbar">
      <div><h1>${esc(t(cfg.title))}</h1><div class="topbar-sub">${esc(t(cfg.subtitle))}</div></div>
      <button class="btn btn-primary" id="saveSingleton">${tf("Save Changes", "حفظ التغييرات")}</button>
    </div>
    <div class="content"><div class="panel"><div id="singletonForm"><div class="loading-row"><div class="spinner"></div>${tf("Loading…", "جارٍ التحميل…")}</div></div></div></div>
  `;
  const { data, error } = await sb.from(cfg.table).select("*").limit(1).maybeSingle();
  if (error) { $("#singletonForm", container).innerHTML = `<div class="empty-state">Couldn't load: ${esc(error.message)}</div>`; return; }
  const existing = data || {};
  const form = buildForm(cfg.fields, existing);
  $("#singletonForm", container).innerHTML = "";
  $("#singletonForm", container).appendChild(form.el);

  $("#saveSingleton", container).addEventListener("click", async () => {
    const btn = $("#saveSingleton", container);
    btn.disabled = true; btn.textContent = tf("Saving…", "جارٍ الحفظ…");
    try {
      const payload = form.getData();
      let err;
      if (existing.id) {
        ({ error: err } = await sb.from(cfg.table).update(payload).eq("id", existing.id));
      } else {
        ({ error: err } = await sb.from(cfg.table).insert(payload));
      }
      if (err) throw err;
      toast(tf(`${cfg.title} saved`, `تم حفظ ${t(cfg.title)}`));
    } catch (e) {
      toast(tf("Save failed: ", "فشل الحفظ: ") + e.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = tf("Save Changes", "حفظ التغييرات");
    }
  });
}

/* ============================================================
   PROJECTS MODULE (relations + media gallery)
============================================================ */
const PROJECT_FIELDS = [
  { key: "slug", type: "text", label: "Slug (leave blank to auto-generate)" },
  { key: "title", type: "i18n", label: "Title" },
  { key: "short_description", type: "i18n_textarea", label: "Short Description" },
  { key: "full_description", type: "i18n_textarea", label: "Full Description" },
  { key: "problem", type: "i18n_textarea", label: "Problem" },
  { key: "solution", type: "i18n_textarea", label: "Solution" },
  { key: "features", type: "i18n_list", label: "Key features" },
  { key: "client_name", type: "text", label: "Client name" },
  { key: "client_country", type: "text", label: "Client country" },
  { key: "start_date", type: "date", label: "Start date" },
  { key: "end_date", type: "date", label: "End date" },
  { key: "year", type: "number", label: "Year" },
  { key: "status", type: "select", label: "Status", options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }], default: "draft" },
  { key: "featured", type: "boolean", label: "Featured project", default: false },
  { key: "sort_order", type: "number", label: "Sort Order", default: 0 },
  { key: "cover_image_url", type: "image", label: "Cover image", folder: "projects" },
  { key: "thumbnail_url", type: "image", label: "Thumbnail", folder: "projects" },
  { key: "logo_url", type: "image", label: "Project logo", folder: "projects" },
  { key: "demo_url", type: "text", label: "Demo URL" },
  { key: "website_url", type: "text", label: "Website URL" },
  { key: "github_url", type: "text", label: "GitHub URL" },
  { key: "app_store_url", type: "text", label: "App Store URL" },
  { key: "play_store_url", type: "text", label: "Play Store URL" },
  { key: "video_url", type: "text", label: "Video URL" },
  { key: "primary_color", type: "color", label: "Brand color" },
  { key: "badge", type: "i18n", label: "Badge text (optional)" },
  { key: "seo_title", type: "i18n", label: "SEO Title" },
  { key: "seo_description", type: "i18n_textarea", label: "SEO Description" },
  { key: "is_visible", type: "boolean", label: "Visible on site", default: true },
];

async function renderProjects(container) {
  container.innerHTML = `
    <div class="topbar">
      <div><h1>${tf("Projects", "المشاريع")}</h1><div class="topbar-sub">${tf("Everything shown in your portfolio grid", "كل ما يظهر في شبكة أعمالك")}</div></div>
      <button class="btn btn-primary" id="addProjectBtn">${tf("+ New Project", "+ مشروع جديد")}</button>
    </div>
    <div class="content">
      <div class="filter-row">
        <input type="text" class="search-input" id="projSearch" placeholder="${tf("Search projects…", "ابحث في المشاريع…")}" style="background:#ffffff08;border:1px solid var(--border);color:var(--text);padding:9px 13px;border-radius:9px;">
        <select id="projStatusFilter" style="background:#ffffff08;border:1px solid var(--border);color:var(--text);padding:9px 13px;border-radius:9px;">
          <option value="">${tf("All statuses", "كل الحالات")}</option>
          <option value="draft">${tf("Draft", "مسودة")}</option>
          <option value="published">${tf("Published", "منشور")}</option>
          <option value="archived">${tf("Archived", "مؤرشف")}</option>
        </select>
      </div>
      <div class="panel"><div class="table-wrap" id="projTableWrap"><div class="loading-row"><div class="spinner"></div>${tf("Loading…", "جارٍ التحميل…")}</div></div></div>
    </div>
  `;
  $("#addProjectBtn", container).addEventListener("click", () => openProjectForm(null, () => renderProjects(container)));

  let allRows = [];
  async function load() {
    const { data, error } = await sb.from("projects").select("*").order("sort_order", { ascending: true });
    const wrap = $("#projTableWrap", container);
    if (error) { wrap.innerHTML = `<div class="empty-state">${tf("Couldn't load projects: ", "تعذّر تحميل المشاريع: ")}${esc(error.message)}</div>`; return; }
    allRows = data;
    draw();
  }
  function draw() {
    const wrap = $("#projTableWrap", container);
    const q = ($("#projSearch", container)?.value || "").toLowerCase();
    const status = $("#projStatusFilter", container)?.value || "";
    const rows = allRows.filter((r) => {
      const matchesQ = !q || i18nPreview(r.title).toLowerCase().includes(q) || (r.slug || "").toLowerCase().includes(q);
      const matchesStatus = !status || r.status === status;
      return matchesQ && matchesStatus;
    });
    if (!rows.length) { wrap.innerHTML = `<div class="empty-state">${tf("No projects match. Try a different search or add a new one.", "لا توجد مشاريع مطابقة. جرّب بحثًا مختلفًا أو أضف مشروعًا جديدًا.")}</div>`; return; }
    const table = h(`
      <table class="data-table">
        <thead><tr><th></th><th>${tf("Title", "العنوان")}</th><th>${tf("Status", "الحالة")}</th><th>${tf("Featured", "مميز")}</th><th>${tf("Year", "السنة")}</th><th>${tf("Views", "المشاهدات")}</th><th>${tf("Order", "الترتيب")}</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    `);
    const tbody = $("tbody", table);
    rows.forEach((r) => {
      const statusBadge = r.status === "published" ? `<span class="badge badge-green">${tf("Published", "منشور")}</span>`
        : r.status === "archived" ? `<span class="badge badge-gray">${tf("Archived", "مؤرشف")}</span>`
        : `<span class="badge badge-gold">${tf("Draft", "مسودة")}</span>`;
      const tr = h(`
        <tr>
          <td>${r.thumbnail_url || r.cover_image_url ? `<img class="cell-thumb" src="${esc(r.thumbnail_url || r.cover_image_url)}">` : ""}</td>
          <td><span class="cell-title">${esc(i18nPreview(r.title))}</span><div class="cell-sub">/${esc(r.slug)}</div></td>
          <td>${statusBadge}</td>
          <td>${r.featured ? `<span class="badge badge-gold">★ ${tf("Featured", "مميز")}</span>` : ""}</td>
          <td>${r.year || "—"}</td>
          <td>${r.views_count ?? 0}</td>
          <td>${r.sort_order ?? 0}</td>
        </tr>
      `);
      const actionsTd = h(`<td><div class="row-actions"><button class="btn-icon edit-btn" title="${tf("Edit", "تعديل")}">✎</button><button class="btn-icon del-btn" title="${tf("Delete", "حذف")}">🗑</button></div></td>`);
      $(".edit-btn", actionsTd).addEventListener("click", () => openProjectForm(r, () => renderProjects(container)));
      $(".del-btn", actionsTd).addEventListener("click", () => confirmDelete({ table: "projects", singular: tf("Project", "مشروع") }, r, () => renderProjects(container)));
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
    wrap.innerHTML = "";
    wrap.appendChild(table);
  }
  $("#projSearch", container).addEventListener("input", draw);
  $("#projStatusFilter", container).addEventListener("change", draw);
  await load();
}

async function openProjectForm(existingRow, onSaved) {
  const isNew = !existingRow;
  const body = h(`<div></div>`);
  const form = buildForm(PROJECT_FIELDS, existingRow || {});
  body.appendChild(form.el);

  // categories + technologies
  const relWrap = h(`
    <div class="span-2" style="margin-top:8px;">
      <label style="display:block;font-size:.8rem;color:var(--text-dim);margin-bottom:8px;">${tf("Categories", "الفئات")}</label>
      <div id="catChips"></div>
      <label style="display:block;font-size:.8rem;color:var(--text-dim);margin:16px 0 8px;">${tf("Technologies", "التقنيات")}</label>
      <div id="techChips"></div>
    </div>
  `);
  form.el.appendChild(relWrap);

  const [{ data: allCats }, { data: allTechs }] = await Promise.all([
    sb.from("project_categories").select("id,name").order("sort_order"),
    sb.from("technologies").select("id,name").order("sort_order"),
  ]);
  let selectedCatIds = [];
  let selectedTechIds = [];
  if (!isNew) {
    const [{ data: catLinks }, { data: techLinks }] = await Promise.all([
      sb.from("project_category_links").select("category_id").eq("project_id", existingRow.id),
      sb.from("project_technologies").select("technology_id").eq("project_id", existingRow.id),
    ]);
    selectedCatIds = (catLinks || []).map((r) => String(r.category_id));
    selectedTechIds = (techLinks || []).map((r) => String(r.technology_id));
  }
  const catBox = $("#catChips", relWrap);
  catBox.className = "chip-select";
  (allCats || []).forEach((c) => {
    const checked = selectedCatIds.includes(String(c.id));
    const chip = h(`<label class="chip-option ${checked ? "checked" : ""}"><input type="checkbox" value="${c.id}" ${checked ? "checked" : ""}>${esc(i18nPreview(c.name))}</label>`);
    $("input", chip).addEventListener("change", (e) => chip.classList.toggle("checked", e.target.checked));
    catBox.appendChild(chip);
  });
  const techBox = $("#techChips", relWrap);
  techBox.className = "chip-select";
  (allTechs || []).forEach((t) => {
    const checked = selectedTechIds.includes(String(t.id));
    const chip = h(`<label class="chip-option ${checked ? "checked" : ""}"><input type="checkbox" value="${t.id}" ${checked ? "checked" : ""}>${esc(t.name)}</label>`);
    $("input", chip).addEventListener("change", (e) => chip.classList.toggle("checked", e.target.checked));
    techBox.appendChild(chip);
  });

  // media gallery (only for existing projects)
  if (!isNew) {
    const mediaSection = h(`
      <div class="span-2" style="margin-top:20px; border-top:1px solid var(--border); padding-top:18px;">
        <label style="display:block;font-size:.8rem;color:var(--text-dim);margin-bottom:10px;">${tf("Media Gallery", "معرض الوسائط")}</label>
        <div id="mediaList"></div>
        <div class="upload-box" style="margin-top:10px;">
          <div class="upload-info">
            <input type="file" accept="image/*,video/*" id="mediaFileInput">
            <small>${tf("Upload an image or video to add to the gallery", "ارفع صورة أو فيديو لإضافته إلى المعرض")}</small>
          </div>
        </div>
      </div>
    `);
    form.el.appendChild(mediaSection);
    await loadMediaGallery(existingRow.id, $("#mediaList", mediaSection));
    $("#mediaFileInput", mediaSection).addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadFile(BUCKET_PORTFOLIO, file, `projects/${existingRow.id}/media`);
        const mediaType = file.type.startsWith("video") ? "video" : "image";
        const { error } = await sb.from("project_media").insert({ project_id: existingRow.id, media_type: mediaType, url, sort_order: 0 });
        if (error) throw error;
        toast(tf("Media added", "تمت إضافة الوسائط"));
        await loadMediaGallery(existingRow.id, $("#mediaList", mediaSection));
      } catch (err) {
        toast(tf("Upload failed: ", "فشل الرفع: ") + err.message, "error");
      }
      e.target.value = "";
    });
  }

  const foot = h(`
    <div style="display:flex; gap:10px; justify-content:flex-end; width:100%;">
      <button class="btn btn-outline" id="cancelBtn">${tf("Cancel", "إلغاء")}</button>
      <button class="btn btn-primary" id="saveBtn">${isNew ? tf("Create Project", "إنشاء مشروع") : tf("Save Changes", "حفظ التغييرات")}</button>
    </div>
  `);
  openModal({ title: isNew ? tf("New Project", "مشروع جديد") : tf(`Edit — ${i18nPreview(existingRow.title)}`, `تعديل — ${i18nPreview(existingRow.title)}`), bodyEl: body, footEl: foot, size: "lg" });
  $("#cancelBtn", foot).addEventListener("click", closeModal);
  $("#saveBtn", foot).addEventListener("click", async () => {
    const btn = $("#saveBtn", foot);
    btn.disabled = true; btn.textContent = tf("Saving…", "جارٍ الحفظ…");
    try {
      const payload = form.getData();
      delete payload.__rel;
      if (!payload.slug) payload.slug = slugify(payload.title?.en || payload.title?.fr || payload.title?.ar || `project-${Date.now()}`);
      if (payload.status === "published" && !existingRow?.published_at) payload.published_at = new Date().toISOString();

      let projectId = existingRow?.id;
      if (isNew) {
        const { data, error } = await sb.from("projects").insert(payload).select().single();
        if (error) throw error;
        projectId = data.id;
      } else {
        const { error } = await sb.from("projects").update(payload).eq("id", projectId);
        if (error) throw error;
      }

      const catIds = $all("input:checked", catBox).map((i) => i.value);
      const techIds = $all("input:checked", techBox).map((i) => i.value);
      await sb.from("project_category_links").delete().eq("project_id", projectId);
      if (catIds.length) await sb.from("project_category_links").insert(catIds.map((id) => ({ project_id: projectId, category_id: id })));
      await sb.from("project_technologies").delete().eq("project_id", projectId);
      if (techIds.length) await sb.from("project_technologies").insert(techIds.map((id, i) => ({ project_id: projectId, technology_id: id, sort_order: i })));

      toast(tf("Project saved", "تم حفظ المشروع"));
      closeModal();
      onSaved && onSaved();
      if (isNew) {
        // reopen in edit mode so the media gallery becomes available
        const { data: fresh } = await sb.from("projects").select("*").eq("id", projectId).single();
        if (fresh) openProjectForm(fresh, onSaved);
      }
    } catch (err) {
      toast(tf("Save failed: ", "فشل الحفظ: ") + err.message, "error");
      btn.disabled = false; btn.textContent = isNew ? tf("Create Project", "إنشاء مشروع") : tf("Save Changes", "حفظ التغييرات");
    }
  });
}

async function loadMediaGallery(projectId, listEl) {
  listEl.innerHTML = `<div class="loading-row"><div class="spinner"></div></div>`;
  const { data, error } = await sb.from("project_media").select("*").eq("project_id", projectId).order("sort_order");
  if (error) { listEl.innerHTML = `<div class="text-dim">${tf("Couldn't load media.", "تعذّر تحميل الوسائط.")}</div>`; return; }
  if (!data.length) { listEl.innerHTML = `<div class="text-dim" style="font-size:.85rem;">${tf("No media yet — upload one below.", "لا توجد وسائط بعد — ارفع واحدة أدناه.")}</div>`; return; }
  listEl.innerHTML = "";
  data.forEach((m) => {
    const item = h(`
      <div class="media-item">
        ${m.media_type === "image" ? `<img src="${esc(m.url)}">` : `<div class="cell-thumb" style="display:flex;align-items:center;justify-content:center;">🎬</div>`}
        <div class="grow">
          <input type="text" placeholder="${tf("Caption", "التسمية التوضيحية")}" value="${esc(m.caption?.en || "")}" data-field="caption">
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="number" style="width:70px;" value="${m.sort_order ?? 0}" data-field="sort_order" title="${tf("Sort order", "ترتيب الفرز")}">
            <label style="display:flex; align-items:center; gap:5px; font-size:.78rem; color:var(--text-dim);">
              <input type="checkbox" ${m.is_cover ? "checked" : ""} data-field="is_cover" style="accent-color:var(--gold);"> ${tf("cover", "غلاف")}
            </label>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <button class="btn-icon save-media" title="${tf("Save", "حفظ")}">💾</button>
          <button class="btn-icon del-media" title="${tf("Delete", "حذف")}">🗑</button>
        </div>
      </div>
    `);
    $(".save-media", item).addEventListener("click", async () => {
      const caption = $('[data-field="caption"]', item).value;
      const sort_order = Number($('[data-field="sort_order"]', item).value || 0);
      const is_cover = $('[data-field="is_cover"]', item).checked;
      const { error: err } = await sb.from("project_media").update({ caption: { en: caption, fr: caption, ar: caption }, sort_order, is_cover }).eq("id", m.id);
      if (err) toast(tf("Save failed: ", "فشل الحفظ: ") + err.message, "error"); else toast(tf("Media updated", "تم تحديث الوسائط"));
    });
    $(".del-media", item).addEventListener("click", async () => {
      const { error: err } = await sb.from("project_media").delete().eq("id", m.id);
      if (err) { toast(tf("Delete failed: ", "فشل الحذف: ") + err.message, "error"); return; }
      await loadMediaGallery(projectId, listEl);
    });
    listEl.appendChild(item);
  });
}

/* ============================================================
   MESSAGES (contact_messages) MODULE
============================================================ */
async function renderMessages(container) {
  container.innerHTML = `
    <div class="topbar">
      <div><h1>${tf("Messages", "الرسائل")}</h1><div class="topbar-sub">${tf("Inbound messages from your contact form", "الرسائل الواردة من نموذج التواصل")}</div></div>
    </div>
    <div class="content">
      <div class="filter-row">
        <select id="msgStatusFilter" style="background:#ffffff08;border:1px solid var(--border);color:var(--text);padding:9px 13px;border-radius:9px;">
          <option value="">${tf("All statuses", "كل الحالات")}</option>
          <option value="new">${tf("New", "جديدة")}</option>
          <option value="read">${tf("Read", "مقروءة")}</option>
          <option value="replied">${tf("Replied", "تم الرد")}</option>
          <option value="archived">${tf("Archived", "مؤرشف")}</option>
          <option value="spam">${tf("Spam", "مزعجة")}</option>
        </select>
      </div>
      <div class="panel"><div class="table-wrap" id="msgTableWrap"><div class="loading-row"><div class="spinner"></div>${tf("Loading…", "جارٍ التحميل…")}</div></div></div>
    </div>
  `;
  async function load() {
    const status = $("#msgStatusFilter", container).value;
    let query = sb.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    const wrap = $("#msgTableWrap", container);
    if (error) { wrap.innerHTML = `<div class="empty-state">${tf("Couldn't load messages: ", "تعذّر تحميل الرسائل: ")}${esc(error.message)}</div>`; return; }
    if (!data.length) { wrap.innerHTML = `<div class="empty-state">${tf("No messages here yet.", "لا توجد رسائل هنا بعد.")}</div>`; return; }
    const table = h(`
      <table class="data-table">
        <thead><tr><th>${tf("From", "من")}</th><th>${tf("Subject", "الموضوع")}</th><th>${tf("Status", "الحالة")}</th><th>${tf("Received", "تاريخ الاستلام")}</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    `);
    const tbody = $("tbody", table);
    const statusBadge = (s) => ({
      new: `<span class="badge badge-gold">${tf("New", "جديدة")}</span>`,
      read: `<span class="badge badge-blue">${tf("Read", "مقروءة")}</span>`,
      replied: `<span class="badge badge-green">${tf("Replied", "تم الرد")}</span>`,
      archived: `<span class="badge badge-gray">${tf("Archived", "مؤرشف")}</span>`,
      spam: `<span class="badge badge-red">${tf("Spam", "مزعجة")}</span>`,
    }[s] || s);
    data.forEach((m) => {
      const tr = h(`
        <tr>
          <td><span class="cell-title">${esc(m.name)}</span><div class="cell-sub">${esc(m.email)}</div></td>
          <td>${esc(m.subject || "—")}</td>
          <td>${statusBadge(m.status)}</td>
          <td>${fmtDateTime(m.created_at)}</td>
        </tr>
      `);
      const actionsTd = h(`<td><div class="row-actions"><button class="btn-icon view-btn" title="${tf("Open", "فتح")}">👁</button></div></td>`);
      tr.style.cursor = "pointer";
      $(".view-btn", actionsTd).addEventListener("click", () => openMessageDetail(m, () => renderMessages(container)));
      tr.addEventListener("click", () => openMessageDetail(m, () => renderMessages(container)));
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
    wrap.innerHTML = "";
    wrap.appendChild(table);
  }
  $("#msgStatusFilter", container).addEventListener("change", load);
  await load();
}

async function openMessageDetail(m, onChanged) {
  const body = h(`
    <div>
      <div class="form-grid" style="margin-bottom:16px;">
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Name", "الاسم")}</label><p>${esc(m.name)}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Email", "البريد الإلكتروني")}</label><p>${esc(m.email)}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Phone", "الهاتف")}</label><p>${esc(m.phone || "—")}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Company", "الشركة")}</label><p>${esc(m.company || "—")}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Project type", "نوع المشروع")}</label><p>${esc(m.project_type || "—")}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Budget", "الميزانية")}</label><p>${esc(m.budget || "—")}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Language", "اللغة")}</label><p>${esc(m.language || "—")}</p></div>
        <div><label style="font-size:.78rem;color:var(--text-dim);">${tf("Received", "تاريخ الاستلام")}</label><p>${fmtDateTime(m.created_at)}</p></div>
      </div>
      <label style="font-size:.78rem;color:var(--text-dim);">${tf("Subject", "الموضوع")}</label>
      <p style="margin-bottom:14px;">${esc(m.subject || "—")}</p>
      <label style="font-size:.78rem;color:var(--text-dim);">${tf("Message", "الرسالة")}</label>
      <p style="white-space:pre-wrap; margin-top:6px; background:#ffffff06; padding:14px; border-radius:9px;">${esc(m.message)}</p>
    </div>
  `);
  const foot = h(`
    <div style="display:flex; gap:8px; justify-content:space-between; width:100%; flex-wrap:wrap;">
      <div style="display:flex; gap:8px;">
        <button class="btn btn-outline btn-sm" data-status="read">${tf("Mark Read", "وضع كمقروءة")}</button>
        <button class="btn btn-outline btn-sm" data-status="replied">${tf("Mark Replied", "وضع كمردود عليها")}</button>
        <button class="btn btn-outline btn-sm" data-status="archived">${tf("Archive", "أرشفة")}</button>
        <button class="btn btn-outline btn-sm" data-status="spam">${tf("Spam", "مزعجة")}</button>
      </div>
      <button class="btn btn-danger btn-sm" id="deleteMsgBtn">${tf("Delete", "حذف")}</button>
    </div>
  `);
  const statusLabel = { read: tf("read", "مقروءة"), replied: tf("replied", "تم الرد عليها"), archived: tf("archived", "مؤرشفة"), spam: tf("spam", "مزعجة") };
  const overlay = openModal({ title: tf(`Message from ${m.name}`, `رسالة من ${m.name}`), bodyEl: body, footEl: foot, size: "lg" });
  $all("[data-status]", foot).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const status = btn.dataset.status;
      const patch = { status };
      if (status === "read" && !m.read_at) patch.read_at = new Date().toISOString();
      if (status === "replied" && !m.replied_at) patch.replied_at = new Date().toISOString();
      const { error } = await sb.from("contact_messages").update(patch).eq("id", m.id);
      if (error) { toast(tf("Update failed: ", "فشل التحديث: ") + error.message, "error"); return; }
      toast(tf(`Marked as ${status}`, `تم وضعها كـ ${statusLabel[status] || status}`));
      closeModal();
      onChanged && onChanged();
    });
  });
  $("#deleteMsgBtn", foot).addEventListener("click", async () => {
    const { error } = await sb.from("contact_messages").delete().eq("id", m.id);
    if (error) { toast(tf("Delete failed (admin only): ", "فشل الحذف (للمسؤول فقط): ") + error.message, "error"); return; }
    toast(tf("Message deleted", "تم حذف الرسالة"));
    closeModal();
    onChanged && onChanged();
  });
}

/* ============================================================
   USERS (profiles) MODULE — admin only
============================================================ */
async function renderUsers(container) {
  container.innerHTML = `
    <div class="topbar"><div><h1>${tf("Users", "المستخدمون")}</h1><div class="topbar-sub">${tf("Manage dashboard access and roles", "إدارة صلاحيات وأدوار لوحة التحكم")}</div></div></div>
    <div class="content">
      <div class="panel">
        <p class="text-dim" style="margin-bottom:16px; font-size:.85rem;">${tf("New accounts appear here automatically after they sign up — promote them to editor or admin below. Deactivate an account to instantly block their dashboard access.", "تظهر الحسابات الجديدة هنا تلقائيًا بعد التسجيل — يمكنك ترقيتها إلى محرر أو مسؤول أدناه. أوقف الحساب لمنع وصوله إلى لوحة التحكم فورًا.")}</p>
        <div class="table-wrap" id="usersWrap"><div class="loading-row"><div class="spinner"></div>${tf("Loading…", "جارٍ التحميل…")}</div></div>
      </div>
    </div>
  `;
  async function load() {
    const { data, error } = await sb.from("profiles").select("*").order("created_at");
    const wrap = $("#usersWrap", container);
    if (error) { wrap.innerHTML = `<div class="empty-state">${tf("Couldn't load users: ", "تعذّر تحميل المستخدمين: ")}${esc(error.message)}</div>`; return; }
    const table = h(`
      <table class="data-table">
        <thead><tr><th>${tf("Name", "الاسم")}</th><th>${tf("Role", "الدور")}</th><th>${tf("Status", "الحالة")}</th><th>${tf("Joined", "تاريخ الانضمام")}</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    `);
    const tbody = $("tbody", table);
    data.forEach((p) => {
      const tr = h(`
        <tr>
          <td><span class="cell-title">${esc(p.full_name || "—")}</span><div class="cell-sub">${esc(p.id)}</div></td>
          <td>
            <select data-role style="background:#ffffff08;border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:8px;">
              <option value="editor" ${p.role === "editor" ? "selected" : ""}>${tf("Editor", "محرر")}</option>
              <option value="admin" ${p.role === "admin" ? "selected" : ""}>${tf("Admin", "مسؤول")}</option>
            </select>
          </td>
          <td>
            <label style="display:flex; align-items:center; gap:6px; font-size:.82rem;">
              <input type="checkbox" data-active ${p.is_active ? "checked" : ""} style="accent-color:var(--gold);"> ${tf("Active", "نشط")}
            </label>
          </td>
          <td>${fmtDate(p.created_at)}</td>
        </tr>
      `);
      const actionsTd = h(`<td><button class="btn btn-outline btn-sm save-user">${tf("Save", "حفظ")}</button></td>`);
      $(".save-user", actionsTd).addEventListener("click", async () => {
        const role = $("[data-role]", tr).value;
        const is_active = $("[data-active]", tr).checked;
        const { error: err } = await sb.from("profiles").update({ role, is_active }).eq("id", p.id);
        if (err) toast(tf("Update failed: ", "فشل التحديث: ") + err.message, "error"); else toast(tf("User updated", "تم تحديث المستخدم"));
      });
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
    wrap.innerHTML = "";
    wrap.appendChild(table);
  }
  await load();
}

/* ============================================================
   DASHBOARD OVERVIEW
============================================================ */
async function renderDashboard(container) {
  container.innerHTML = `
    <div class="topbar">
      <div><h1>${tf("Dashboard", "لوحة القيادة")}</h1><div class="topbar-sub">${tf("Welcome back", "مرحبًا بعودتك")}${state.profile?.full_name ? ", " + esc(state.profile.full_name) : ""}</div></div>
    </div>
    <div class="content">
      <div class="stat-grid" id="statGrid"><div class="loading-row"><div class="spinner"></div></div></div>
      <div class="panel">
        <div class="panel-head"><h3>${tf("Recent messages", "أحدث الرسائل")}</h3></div>
        <div class="table-wrap" id="recentMsgs"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>
  `;
  const [{ count: totalProjects }, { count: publishedProjects }, { count: newMessages }, { count: totalMessages }, { data: recent }] = await Promise.all([
    sb.from("projects").select("*", { count: "exact", head: true }),
    sb.from("projects").select("*", { count: "exact", head: true }).eq("status", "published"),
    sb.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
    sb.from("contact_messages").select("*", { count: "exact", head: true }),
    sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(5),
  ]);
  $("#statGrid", container).innerHTML = `
    <div class="stat-card"><b>${totalProjects ?? 0}</b><span>${tf("Total Projects", "إجمالي المشاريع")}</span></div>
    <div class="stat-card"><b>${publishedProjects ?? 0}</b><span>${tf("Published", "منشور")}</span></div>
    <div class="stat-card"><b>${newMessages ?? 0}</b><span>${tf("New Messages", "رسائل جديدة")}</span></div>
    <div class="stat-card"><b>${totalMessages ?? 0}</b><span>${tf("Total Messages", "إجمالي الرسائل")}</span></div>
  `;
  const wrap = $("#recentMsgs", container);
  if (!recent || !recent.length) { wrap.innerHTML = `<div class="empty-state">${tf("No messages yet.", "لا توجد رسائل بعد.")}</div>`; return; }
  const table = h(`<table class="data-table"><thead><tr><th>${tf("From", "من")}</th><th>${tf("Subject", "الموضوع")}</th><th>${tf("Received", "تاريخ الاستلام")}</th></tr></thead><tbody></tbody></table>`);
  const tbody = $("tbody", table);
  recent.forEach((m) => {
    tbody.appendChild(h(`<tr><td><span class="cell-title">${esc(m.name)}</span><div class="cell-sub">${esc(m.email)}</div></td><td>${esc(m.subject || "—")}</td><td>${fmtDateTime(m.created_at)}</td></tr>`));
  });
  wrap.innerHTML = "";
  wrap.appendChild(table);
}

/* ============================================================
   ROUTER
============================================================ */
function closeMobileSidebar() {
  $(".sidebar")?.classList.remove("open");
  $(".sidebar-backdrop")?.classList.remove("show");
}

function openMobileSidebar() {
  $(".sidebar")?.classList.add("open");
  $(".sidebar-backdrop")?.classList.add("show");
}

function toggleMobileSidebar() {
  const sbEl = $(".sidebar");
  if (!sbEl) return;
  if (sbEl.classList.contains("open")) closeMobileSidebar();
  else openMobileSidebar();
}

async function renderRoute(key) {
  const container = $("#mainContent");
  if (!container) return;
  container.innerHTML = `<div class="loading-row"><div class="spinner"></div></div>`;
  $all(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.key === key));
  closeMobileSidebar();

  if (key === "dashboard") return renderDashboard(container);
  if (key === "hero") return renderSingleton(container, "hero");
  if (key === "about") return renderSingleton(container, "about");
  if (key === "contact_info") return renderSingleton(container, "contact_info");
  if (key === "site_settings") return renderSingleton(container, "site_settings");
  if (key === "projects") return renderProjects(container);
  if (key === "messages") return renderMessages(container);
  if (key === "users") return renderUsers(container);
  if (SCHEMAS[key]) return renderGenericCRUD(container, key);

  container.innerHTML = `<div class="content"><div class="empty-state">${tf("Page not found.", "الصفحة غير موجودة.")}</div></div>`;
}

function setRoute(key) {
  location.hash = key;
}

window.addEventListener("hashchange", () => {
  const key = location.hash.replace("#", "") || "dashboard";
  state.route = key;
  renderRoute(key);
});

/* ============================================================
   SIDEBAR
============================================================ */
function renderSidebar() {
  const isAdmin = state.profile?.role === "admin";
  const groupsHtml = NAV.map((group) => {
    const items = group.items.filter((i) => !i.adminOnly || isAdmin);
    if (!items.length) return "";
    return `
      <div class="nav-group">
        <div class="nav-group-title">${esc(t(group.group))}</div>
        ${items.map((i) => `
          <div class="nav-item" data-key="${i.key}">
            ${ICONS[i.icon] || ""}<span>${esc(t(i.label))}</span>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");

  const initials = (state.profile?.full_name || state.user?.email || "?").trim().slice(0, 1).toUpperCase();

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <img src="assets/logo-transparent.png" onerror="this.style.display='none'">
        <span>${tf("Admin Panel", "لوحة التحكم")}</span>
      </div>
      <div style="flex:1;">${groupsHtml}</div>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${initials}</div>
          <div>
            <div class="sidebar-user-name">${esc(state.profile?.full_name || state.user?.email || "")}</div>
            <div class="sidebar-user-role">${esc(t(state.profile?.role === "admin" ? "Admin" : "Editor"))}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-block btn-sm" id="langToggleBtn" style="margin-bottom:8px;">${tf("العربية", "English")}</button>
        <button class="btn btn-outline btn-block btn-sm" id="logoutBtn">${tf("Log out", "تسجيل الخروج")}</button>
      </div>
    </aside>
  `;
}

function renderAppShell() {
  document.body.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <div class="main">
        <div id="mainContent"></div>
      </div>
    </div>
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
    <button class="nav-toggle-mobile" id="mobileNavToggle" style="position:fixed; top:14px; ${LANG === "ar" ? "right" : "left"}:14px; z-index:30;" aria-label="Menu">☰</button>
  `;
  $all(".nav-item").forEach((item) => {
    item.addEventListener("click", () => setRoute(item.dataset.key));
  });
  $("#logoutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    location.reload();
  });
  $("#langToggleBtn").addEventListener("click", toggleLang);
  $("#mobileNavToggle").addEventListener("click", toggleMobileSidebar);
  $("#sidebarBackdrop").addEventListener("click", closeMobileSidebar);

  const key = location.hash.replace("#", "") || "dashboard";
  state.route = key;
  renderRoute(key);
}

/* ============================================================
   AUTH
============================================================ */
function renderLoginScreen(errorMsg) {
  applyLangToDocument();
  document.body.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <button class="btn btn-outline btn-sm" id="langToggleBtn" style="margin-bottom:14px;">${tf("العربية", "English")}</button>
        <div class="login-logo"><img src="assets/logo-transparent.png" onerror="this.style.display='none'" alt="logo"></div>
        <h1>${tf("Admin Dashboard", "لوحة تحكم المسؤول")}</h1>
        <p class="login-sub">${tf("Sign in to manage your portfolio content", "سجّل الدخول لإدارة محتوى موقعك")}</p>
        ${errorMsg ? `<div class="login-error">${esc(errorMsg)}</div>` : ""}
        <form id="loginForm">
          <div class="field">
            <label>${tf("Email", "البريد الإلكتروني")}</label>
            <input type="email" id="loginEmail" required autocomplete="username">
          </div>
          <div class="field">
            <label>${tf("Password", "كلمة المرور")}</label>
            <input type="password" id="loginPassword" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="loginSubmit">${tf("Sign In", "تسجيل الدخول")}</button>
        </form>
      </div>
    </div>
  `;
  $("#langToggleBtn").addEventListener("click", toggleLang);
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginSubmit");
    btn.disabled = true; btn.textContent = tf("Signing in…", "جارٍ تسجيل الدخول…");
    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { renderLoginScreen(error.message); return; }
    await afterLogin(data.user);
  });
}

async function afterLogin(user) {
  state.user = user;
  const { data: profile, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !profile) {
    await sb.auth.signOut();
    renderLoginScreen(tf("No dashboard profile found for this account. Contact an admin.", "لا يوجد ملف تعريف للوحة التحكم لهذا الحساب. تواصل مع أحد المسؤولين."));
    return;
  }
  if (!profile.is_active) {
    await sb.auth.signOut();
    renderLoginScreen(tf("This account has been deactivated. Contact an admin.", "تم إيقاف هذا الحساب. تواصل مع أحد المسؤولين."));
    return;
  }
  if (profile.role !== "admin" && profile.role !== "editor") {
    await sb.auth.signOut();
    renderLoginScreen(tf("This account does not have dashboard access.", "لا يملك هذا الحساب صلاحية الوصول إلى لوحة التحكم."));
    return;
  }
  state.profile = profile;
  renderAppShell();
}

async function init() {
  document.body.innerHTML = `<div class="login-screen"><div class="spinner"></div></div>`;
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    await afterLogin(session.user);
  } else {
    renderLoginScreen();
  }
}

init();
