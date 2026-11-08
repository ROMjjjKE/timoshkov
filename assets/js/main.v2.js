/* ИП Тимошков: меню, заявка на материалы (корзина), форма */

var WA_BASE = 'https://wa.me/375339155350';
var STORE = 'ts_zakaz_v2';

document.addEventListener('DOMContentLoaded', function () {
  initDrawer();
  initCart();
  initForm();
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

function initDrawer() {
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (!burger || !drawer) return;
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    var btn = document.getElementById('drawer-close');
    if (btn) btn.focus({ preventScroll: true });
  }

  function close() {
    drawer.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  burger.addEventListener('click', function () {
    if (drawer.hidden) open(); else close();
  });

  var closeBtn = document.getElementById('drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', close);

  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) { close(); return; }
    if (!e.target.closest('.drawer__inner')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (drawer.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var items = drawer.querySelectorAll('a, button');
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1180 && !drawer.hidden) close();
  });
}

/* Диагностика: счётчик отмеченного и сборка списка в WhatsApp */
/* Заявка на материалы: список в localStorage, панель, отправка в WhatsApp */
function initCart() {
  var cart = document.getElementById('cart');
  var list = cart ? cart.querySelector('[data-cart-list]') : null;
  var empty = cart ? cart.querySelector('[data-cart-empty]') : null;
  var send = cart ? cart.querySelector('[data-cart-send]') : null;
  var counter = document.querySelector('[data-cart-count]');
  var lastFocus = null;

  var state = {};
  try { state = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { state = {}; }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function keys() { return Object.keys(state); }
  function total() { return keys().reduce(function (n, k) { return n + state[k]; }, 0); }

  function nameOf(id) {
    var row = document.querySelector('[data-item="' + id + '"] .item__t');
    return row ? row.textContent.trim() : id;
  }
  function unitOf(id) {
    var row = document.querySelector('[data-item="' + id + '"] .item__unit');
    return row ? row.textContent.trim() : '';
  }

  function paintButtons() {
    document.querySelectorAll('[data-add]').forEach(function (btn) {
      var on = !!state[btn.getAttribute('data-add')];
      btn.classList.toggle('is-on', on);
      btn.textContent = on ? 'В заявке ✓' : 'В заявку';
    });
    if (counter) counter.textContent = total();
  }

  function render() {
    if (!list) return;
    list.innerHTML = '';
    var ks = keys();
    ks.forEach(function (id) {
      var li = document.createElement('li');
      li.innerHTML = '<div><b></b><span></span></div>' +
        '<div class="cart__qty"><button type="button" data-dec="' + id + '" aria-label="Убрать одну единицу">−</button>' +
        '<i></i><button type="button" data-inc="' + id + '" aria-label="Добавить одну единицу">+</button></div>';
      li.querySelector('b').textContent = nameOf(id);
      li.querySelector('span').textContent = 'В заявке: ' + state[id] + ' ' + unitOf(id);
      li.querySelector('i').textContent = state[id];
      list.appendChild(li);
    });
    if (empty) empty.hidden = ks.length > 0;
    if (send) {
      var text = buildText();
      send.href = WA_BASE + '?text=' + encodeURIComponent(text);
    }
    paintButtons();
  }

  function buildText() {
    var ks = keys();
    if (!ks.length) return 'Здравствуйте! Хочу запросить цену и наличие материалов с сайта.';
    var rows = ['Заявка на материалы с сайта ИП Тимошков', ''];
    ks.forEach(function (id) {
      rows.push('• ' + nameOf(id) + ': ' + state[id] + ' ' + unitOf(id));
    });
    rows.push('', 'Прошу подтвердить цену, наличие и срок отгрузки.');
    return rows.join('\n');
  }

  function open() {
    if (!cart) return;
    lastFocus = document.activeElement;
    render();
    cart.hidden = false;
    document.body.classList.add('is-cart');
    var x = cart.querySelector('.cart__x');
    if (x) x.focus({ preventScroll: true });
  }
  function close() {
    if (!cart) return;
    cart.hidden = true;
    document.body.classList.remove('is-cart');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-cart-open]').forEach(function (b) {
    b.addEventListener('click', open);
  });

  document.addEventListener('click', function (e) {
    if (!cart) return;
    if (e.target.closest('[data-cart-close]')) { close(); return; }
    var add = e.target.closest('[data-add]');
    if (add) {
      var id = add.getAttribute('data-add');
      state[id] = (state[id] || 0) + 1;
      save(); render();
      return;
    }
    var inc = e.target.closest('[data-inc]');
    if (inc) { var i1 = inc.getAttribute('data-inc'); state[i1] = (state[i1] || 0) + 1; save(); render(); return; }
    var dec = e.target.closest('[data-dec]');
    if (dec) {
      var i2 = dec.getAttribute('data-dec');
      state[i2] = (state[i2] || 0) - 1;
      if (state[i2] <= 0) delete state[i2];
      save(); render();
      return;
    }
    var clr = e.target.closest('[data-cart-clear]');
    if (clr) { state = {}; save(); render(); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (!cart || cart.hidden) return;
    if (e.key === 'Escape') { close(); return; }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1180 && cart && !cart.hidden) close();
  });

  // новая заявка со страницы контактов
  var form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', function () {
      setTimeout(render, 0);
    });
  }

  render();
}

/* Форма заявки: собирает текст и открывает WhatsApp */
function initForm() {
  var form = document.getElementById('order-form');
  if (!form) return;
  var warn = form.querySelector('[data-form-warn]');
  var out = document.getElementById('order-text');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name');
    var contact = document.getElementById('f-contact');
    var bad = false;
    [name, contact].forEach(function (el) {
      if (!el.value.trim()) { el.style.borderColor = '#A32B12'; bad = true; }
      else el.style.borderColor = '';
    });
    if (warn) warn.hidden = !bad;
    if (bad) return;

    var what = document.getElementById('f-what').value;
    var area = document.getElementById('f-area').value.trim();
    var msg = document.getElementById('f-msg').value.trim();

    var rows = ['Заявка с сайта: ИП Тимошков (материалы и монтаж)', 'Имя: ' + name.value.trim(), 'Контакт: ' + contact.value.trim(), 'Нужно: ' + what];
    if (area) rows.push('Площадь: ' + area + ' м²');
    if (msg) rows.push('Детали: ' + msg);

    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (err) {}
    var ks = Object.keys(stored);
    if (ks.length) {
      rows.push('', 'Заявка на материалы:');
      ks.forEach(function (id) {
        var el = document.querySelector('[data-item="' + id + '"] .item__t');
        var un = document.querySelector('[data-item="' + id + '"] .item__unit');
        rows.push('• ' + (el ? el.textContent.trim() : id) + ': ' + stored[id] + ' ' + (un ? un.textContent.trim() : ''));
      });
    }

    var text = rows.join('\n');
    if (out) out.value = text;
    window.location.href = WA_BASE + '?text=' + encodeURIComponent(text);
  });
}
