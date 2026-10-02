// Lead forms: validation, file list, multi-step wizard, AJAX submit, analytics goals.
// Without JS the forms still post natively to the endpoint, which redirects to /raschet/spasibo/.

declare global {
  interface Window { ym?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void; __ymId?: string }
}

const MAX_FILES = 10;
const MAX_FILE_MB = 15;
const MAX_TOTAL_MB = 40;

export function goal(name: string) {
  try {
    if (window.ym && window.__ymId) window.ym(Number(window.__ymId), 'reachGoal', name);
    window.gtag?.('event', name);
  } catch { /* analytics must never break the page */ }
}

function showError(form: HTMLFormElement, msg: string) {
  const el = form.querySelector<HTMLElement>('[data-error]');
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

function phoneOk(v: string) {
  return v.replace(/\D/g, '').length >= 9;
}

function validate(scope: HTMLElement, form: HTMLFormElement): string {
  const groups = new Set<string>();
  scope.querySelectorAll<HTMLInputElement>('[data-required-group]').forEach((i) => groups.add(i.dataset.requiredGroup!));
  for (const g of groups) {
    if (!scope.querySelector(`[data-required-group="${g}"]:checked`)) return 'Выберите, какая мебель нужна.';
  }
  for (const el of scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')) {
    if (el.type === 'checkbox' && !(el as HTMLInputElement).checked) return 'Нужно согласие на обработку персональных данных.';
    if (el.type === 'file' && !(el as HTMLInputElement).files?.length) return 'Прикрепите файл проекта.';
    if (!el.value.trim()) { el.focus(); return 'Заполните обязательные поля.'; }
    if (el.type === 'tel' && !phoneOk(el.value)) { el.focus(); return 'Проверьте номер телефона.'; }
  }
  const files = [...form.querySelectorAll<HTMLInputElement>('input[type=file]')].flatMap((i) => [...(i.files ?? [])]);
  if (files.length > MAX_FILES) return `Можно прикрепить до ${MAX_FILES} файлов.`;
  if (files.some((f) => f.size > MAX_FILE_MB * 1024 * 1024)) return `Каждый файл — до ${MAX_FILE_MB} МБ.`;
  if (files.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_MB * 1024 * 1024) return `Общий размер файлов — до ${MAX_TOTAL_MB} МБ.`;
  return '';
}

function initFiles(form: HTMLFormElement) {
  form.querySelectorAll<HTMLInputElement>('input[type=file]').forEach((input) => {
    const list = input.parentElement?.querySelector<HTMLUListElement>('[data-files]');
    input.addEventListener('change', () => {
      if (!list) return;
      list.innerHTML = '';
      [...(input.files ?? [])].forEach((f) => {
        const li = document.createElement('li');
        li.textContent = `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} МБ)`;
        list.append(li);
      });
    });
  });
}

function initWizard(form: HTMLFormElement) {
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-step]')];
  if (!steps.length) return;
  const label = form.querySelector<HTMLElement>('[data-progress]');
  const bar = form.querySelector<HTMLElement>('.wizard__bar i');
  const prev = form.querySelector<HTMLButtonElement>('[data-prev]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  let i = 0;

  const show = (n: number) => {
    i = n;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (label) label.textContent = `Шаг ${i + 1} из ${steps.length} · ${steps[i].dataset.title ?? ''}`;
    if (bar) bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    prev.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    showError(form, '');
  };

  next.addEventListener('click', () => {
    const err = validate(steps[i], form);
    if (err) return showError(form, err);
    goal(`calc_step_${i + 2}`);
    show(i + 1);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  prev.addEventListener('click', () => show(i - 1));

  // Kitchen-only questions.
  const kitchen = form.querySelector<HTMLElement>('[data-only="kuhni"]');
  const syncKitchen = () => {
    if (kitchen) kitchen.hidden = !form.querySelector('input[name="category[]"][value="kuhni"]:checked');
  };
  form.addEventListener('change', syncKitchen);
  syncKitchen();
  show(0);
}

function initSubmit(form: HTMLFormElement) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = validate(form, form);
    if (err) return showError(form, err);
    showError(form, '');
    const btn = form.querySelector<HTMLButtonElement>('[type=submit]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent ?? ''; btn.textContent = 'Отправляем…'; }
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'send failed');
      goal(`lead_${form.dataset.lead}`);
      location.href = `/raschet/spasibo/?form=${encodeURIComponent(form.dataset.lead ?? '')}`;
    } catch (ex) {
      const msg = ex instanceof Error && ex.message !== 'send failed' && !ex.message.includes('fetch') ? ex.message : '';
      showError(form, msg || 'Не удалось отправить заявку. Позвоните или напишите нам — контакты внизу страницы.');
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label ?? 'Отправить'; }
    }
  });
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-lead]').forEach((form) => {
    initFiles(form);
    initWizard(form);
    initSubmit(form);
    form.addEventListener('focusin', () => goal(`form_start_${form.dataset.lead}`), { once: true });
  });
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-goal]');
    if (a) goal(a.dataset.goal!);
  });
}
