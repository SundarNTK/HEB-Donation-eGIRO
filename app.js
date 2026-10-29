/* UI-only demo: no backend. All "payments" are simulated. */
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app'), modal = $('#modal');
const SERVICES = {
  'Donation': ['Donation Collections - General', 'Annadhanam Donation', 'Temple Building Fund'],
  'Temple Maintenance': ['Daily Maintenance', 'Festival Fund'],
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BANKS = ['DBS / POSB', 'OCBC', 'UOB', 'Standard Chartered', 'Maybank', 'Citibank', 'HSBC'];
const D = { category: 'Donation', service: 'Donation Collections - General', amount: '', name: '', email: '', mobile: '', office: '', nric: '', block: '', unit: '', street: '', country: 'Singapore', postal: '', remark: '' };
const E = { amount: '', day: 5, end: '', bank: '', segment: 'Retail', status: '', ref: '', rcpt: '' };
const sgd = n => 'SGD ' + Number(n).toFixed(2);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ref = p => p + '-' + Date.now().toString().slice(-8);
const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
const fmt = d => new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
const go = h => { location.hash = h; };
const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');


const tick = (ok = true) => ok
  ? `<svg class="tick" viewBox="0 0 52 52"><circle class="tc" cx="26" cy="26" r="24"/><path class="tp" d="M14 27l8 8 16-17"/></svg>`
  : `<svg class="tick warn" viewBox="0 0 52 52"><circle class="tc" cx="26" cy="26" r="24"/><path class="tp" d="M26 14v16M26 37v1"/></svg>`;
const rows = list => `<dl class="rows">${list.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

/* ---------- Donation form ---------- */
function viewDonation() {
  const f = (id, label, req, ph, extra = '') => `<div class="f"><label for="${id}">${label}${req ? '<i>*</i>' : ''}</label><input id="${id}" placeholder="${ph}" value="${esc(D[id])}" ${extra}><div class="err">${id === 'name' ? 'Name is required' : 'Enter a valid email'}</div></div>`;
  const phone = (id, label, req) => `<div class="f"><label>${label}${req ? '<i>*</i>' : ''}</label><div class="ig" id="g_${id}"><span>+65</span><input id="${id}" inputmode="numeric" maxlength="8" placeholder="${label}" value="${esc(D[id])}"></div><div class="err">Enter a valid 8-digit number</div></div>`;
  app.innerHTML = `
  <button class="back" onclick="go('/')">← Back to Home</button>
  <div class="card"><h1>Make a Donation</h1><p class="sub">Your generous contribution supports temple services and community programs.</p></div>
  <div class="card"><h2>Donation Type</h2><div class="grid">
    <div class="f"><label>Donation Category<i>*</i></label><select id="category">${Object.keys(SERVICES).map(c => `<option ${c === D.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="f"><label>Donation Service<i>*</i></label><select id="service">${SERVICES[D.category].map(s => `<option ${s === D.service ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
  </div><div style="height:24px"></div></div>
  <div class="card"><h2>Donation Amount</h2>
    <div class="quick">${[50, 100, 200, 500].map(a => `<button type="button" class="chip" data-a="${a}">SGD ${a}</button>`).join('')}</div>
    <div class="f"><label>Enter your amount (Minimum SGD 0.01)<i>*</i></label><div class="ig" id="g_amount"><span>SGD</span><input id="amount" type="number" min="0.01" step="0.01" placeholder="Amount" value="${esc(D.amount)}"></div><div class="err">Enter an amount of at least SGD 0.01</div></div>
  </div>
  <div class="card"><h2>Personal Details</h2><div class="grid">
    ${f('name', 'Name', 1, 'Name')}${f('email', 'Email ID', 1, 'Email Address', 'type="email"')}
    ${phone('mobile', 'Mobile Number', 1)}${phone('office', 'Office Mobile', 0)}
    ${f('nric', 'NRIC', 0, 'NRIC')}${f('block', 'Block', 0, 'Block')}
    ${f('unit', 'Unit', 0, 'Unit')}${f('street', 'Street', 0, 'Street')}
    ${f('country', 'Country', 0, 'Country')}${f('postal', 'Postal Code', 0, 'Postal Code')}
  </div><div class="f"><label for="remark">Remark</label><textarea id="remark" placeholder="Remark">${esc(D.remark)}</textarea></div></div>
  <div class="card"><div class="terms">Terms and Conditions</div><div class="terms-box">No specific terms defined for this service.</div></div>
  <div class="card"><button class="btn" id="proceed">Proceed to Payment</button></div>`;

  $('#category').onchange = e => { D.category = e.target.value; D.service = SERVICES[D.category][0]; viewDonation(); };
  $('#service').onchange = e => { D.service = e.target.value; };
  const amt = $('#amount');
  const sync = () => document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.a === String(amt.value)));
  document.querySelectorAll('.chip').forEach(c => { c.onclick = () => { amt.value = c.dataset.a; sync(); }; });
  amt.oninput = sync; sync();

  $('#proceed').onclick = () => {
    ['amount', 'name', 'email', 'mobile', 'office', 'nric', 'block', 'unit', 'street', 'country', 'postal', 'remark'].forEach(k => { D[k] = $('#' + k).value.trim(); });
    const mark = (sel, isBad) => { $(sel).classList.toggle('bad', isBad); return isBad; };
    const results = [
      mark('#g_amount', !(parseFloat(D.amount) >= 0.01)),
      mark('#name', !D.name),
      mark('#email', !/^\S+@\S+\.\S+$/.test(D.email)),
      mark('#g_mobile', !/^\d{8}$/.test(D.mobile)),
      mark('#g_office', !!D.office && !/^\d{8}$/.test(D.office)),
    ];
    if (results.some(Boolean)) { $('.bad').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    E.amount = D.amount;
    openChoice();
  };
}

/* ---------- Popup 1: choose payment type ---------- */
function showModal(html) {
  modal.innerHTML = `<div class="ov"><div class="modal"><button class="x" aria-label="Close">×</button>${html}</div></div>`;
  $('.x', modal).onclick = closeModal;
  $('.ov', modal).onclick = e => { if (e.target.classList.contains('ov')) closeModal(); };
}
function closeModal() { modal.innerHTML = ''; }
function openChoice() {
  showModal(`<h3>Choose how you'd like to donate</h3><p class="sub">Donating ${sgd(D.amount)} to ${esc(D.service)}</p>
  <div class="opts">
    <button class="opt" id="onetime"><span class="ic">💳</span><span><b>One-time payment</b><small>Pay once using PayNow or eNETS (debit/credit card).</small></span></button>
    <button class="opt" id="recurring"><span class="ic">🔁</span><span><b>Recurring payment by eGIRO<span class="tag">Monthly auto-debit</span></b><small>Approve a standing instruction at your bank. Donate automatically every month. No money is taken today.</small></span></button>
  </div>`);
  $('#onetime').onclick = () => { closeModal(); go('/payment'); };
  $('#recurring').onclick = openEgiro;
}

/* ---------- Popup 2: eGIRO details ---------- */
function openEgiro() {
  if (!E.end) E.end = addMonths(new Date(), 12).toISOString().slice(0, 7);
  const y0 = new Date().getFullYear(), years = Array.from({ length: 11 }, (_, i) => y0 + i);
  showModal(`<h3>Set up monthly auto-debit (eGIRO)</h3><p class="sub" style="margin-bottom:16px">You will approve this inside your own bank. HEB never sees your bank login.</p>
  <div class="grid">
    <div class="f"><label>Amount per month<i>*</i></label><div class="ig"><span>SGD</span><input id="e_amt" type="text" inputmode="decimal" autocomplete="off" placeholder="Enter amount" value="${esc(E.amount)}"></div></div>
    <div class="f"><label>Debit on day<i>*</i></label><select id="e_day">${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}" ${E.day === i + 1 ? 'selected' : ''}>${ord(i + 1)} of each month</option>`).join('')}</select></div>
    <div class="f"><label>Until (end month &amp; year)<i>*</i></label><div class="ym"><select id="e_em">${MONTHS.map((m, i) => `<option value="${i + 1}" ${+E.end.slice(5) === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select><select id="e_ey">${years.map(y => `<option ${+E.end.slice(0, 4) === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div><div class="err" id="e_eerr">End date must be in the future</div></div>
    <div class="f"><label>Account type<i>*</i></label><select id="e_seg"><option ${E.segment === 'Retail' ? 'selected' : ''}>Retail</option><option ${E.segment === 'Corporate' ? 'selected' : ''}>Corporate</option></select></div>
  </div>
  <div class="f"><label>Your bank<i>*</i></label><select id="e_bank"><option value="">Select your bank</option>${BANKS.map(b => `<option ${E.bank === b ? 'selected' : ''}>${b}</option>`).join('')}</select><div class="err">Please select your bank</div></div>
  <div class="note">• Maximum per debit is capped at your monthly amount.<br>• First debit is on the next due date after approval.<br>• You can cancel anytime from your bank.</div>
  <label class="chk"><input type="checkbox" id="e_c1"> I authorise HEB to collect the above amount monthly from my bank account via eGIRO.</label>
  <label class="chk"><input type="checkbox" id="e_c2"> I have read the Terms and Conditions and Privacy Policy.</label>
  <div class="err" id="e_cerr">Please accept both to continue</div>
  <div style="display:flex;gap:10px;margin-top:14px"><button class="btn ghost" id="e_back">Back</button><button class="btn" id="e_go">Continue to bank</button></div>`);
  const amtEl = $('#e_amt');
  amtEl.oninput = () => { amtEl.value = amtEl.value.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1'); amtEl.classList.remove('bad'); };
  amtEl.onfocus = () => amtEl.select();
  $('#e_back').onclick = openChoice;
  $('#e_go').onclick = () => {
    E.amount = $('#e_amt').value; E.day = +$('#e_day').value; E.end = $('#e_ey').value + '-' + String($('#e_em').value).padStart(2, '0');
    const endOk = new Date(E.end + '-28') > new Date();
    $('#e_eerr').style.display = endOk ? 'none' : 'block'; E.segment = $('#e_seg').value; E.bank = $('#e_bank').value;
    $('#e_bank').classList.toggle('bad', !E.bank);
    $('#e_amt').classList.toggle('bad', !(+E.amount > 0));
    const ok = $('#e_c1').checked && $('#e_c2').checked;
    $('#e_cerr').style.display = ok ? 'none' : 'block';
    if (!E.bank || !ok || !(+E.amount > 0) || !endOk) return;
    closeModal(); E.ref = ref('EG'); go('/bank');
  };
}

/* ---------- One-time payment pages ---------- */
function summary() {
  return `<table class="sum"><tr><td>Service</td><td>${esc(D.service)}</td></tr><tr><td>Donor</td><td>${esc(D.name)}</td></tr><tr><td>Email</td><td>${esc(D.email)}</td></tr><tr class="t"><td>Total</td><td>${sgd(D.amount)}</td></tr></table>`;
}
function guard() { if (!D.amount || !D.name) { go('/'); return false; } return true; }
const stepper = n => `<div class="steps"><div class="${n > 1 ? 'done' : 'on'}" data-n="1">Details</div><div class="${n === 2 ? 'on' : ''}" data-n="2">Payment</div><div data-n="3">Done</div></div>`;
let method = 'PayNow';
function viewPayment() {
  if (!guard()) return;
  app.innerHTML = `<button class="back" onclick="go('/')">← Edit donation</button>${stepper(2)}
  <div class="card"><h2>Order Summary</h2>${summary()}</div>
  <div class="card"><h2>Payment Method</h2><div class="pm">
    <label class="${method === 'PayNow' ? 'on' : ''}"><input type="radio" name="pm" value="PayNow" ${method === 'PayNow' ? 'checked' : ''}><span>PayNow<small>Scan QR to pay</small></span></label>
    <label class="${method === 'eNETS' ? 'on' : ''}"><input type="radio" name="pm" value="eNETS" ${method === 'eNETS' ? 'checked' : ''}><span>eNETS<small>Debit/Credit Card</small></span></label>
  </div><button class="btn" id="pay">Pay ${sgd(D.amount)}</button></div>`;
  document.querySelectorAll('[name=pm]').forEach(r => { r.onchange = () => { method = r.value; viewPayment(); }; });
  $('#pay').onclick = () => go(method === 'PayNow' ? '/paynow' : '/enets');
}
function qrSvg() {
  const n = 25, c = 8;
  let s = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const fx = x < 7 ? x : x > n - 8 ? x - (n - 7) : -1;
    const fy = y < 7 ? y : y > n - 8 ? y - (n - 7) : -1;
    const finder = fx >= 0 && fy >= 0 && !(x > 6 && x < n - 7 && y > 6) && (x < 7 || x > n - 8) && (y < 7 || y > n - 8) && !(x > n - 8 && y > n - 8);
    let on;
    if (finder) on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5);
    else on = ((x * 7 + y * 13 + x * y) % 5) < 2;
    if (on) s += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}"/>`;
  }
  return `<svg class="qr" width="200" height="200" viewBox="0 0 ${n * c} ${n * c}" fill="#6a1b9a">${s}</svg>`;
}
function viewPayNow() {
  if (!guard()) return;
  app.innerHTML = `<button class="back" onclick="go('/payment')">← Change method</button>${stepper(2)}
  <div class="card center"><h2>Pay with PayNow</h2><p class="sub">Open your banking app and scan this QR code (demo)</p>${qrSvg()}
  <p style="font-size:20px;font-weight:700;color:var(--brand);margin:6px 0">${sgd(D.amount)}</p><p class="sub" id="cd">Expires in 15:00</p><br>
  <button class="btn" id="paid">I have paid (demo)</button></div>`;
  let t = 900;
  const iv = setInterval(() => {
    const el = $('#cd'); if (!el) return clearInterval(iv);
    t--; el.textContent = t > 0 ? `Expires in ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` : 'QR expired. Go back and try again.';
  }, 1000);
  $('#paid').onclick = () => { clearInterval(iv); E.rcpt = ref('OBSDN'); go('/success'); };
}
function viewEnets() {
  if (!guard()) return;
  app.innerHTML = `<button class="back" onclick="go('/payment')">← Change method</button>${stepper(2)}
  <div class="card"><h2>eNETS secure payment (demo)</h2>
  <div class="f"><label>Card number</label><input id="cn" inputmode="numeric" maxlength="19" placeholder="4111 1111 1111 1111"></div>
  <div class="grid"><div class="f"><label>Expiry</label><input id="ce" maxlength="5" placeholder="MM/YY"></div><div class="f"><label>CVV</label><input id="cv" type="password" maxlength="3" placeholder="***"></div></div>
  <button class="btn" id="paid">Pay ${sgd(D.amount)}</button></div>`;
  $('#cn').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim(); };
  $('#paid').onclick = () => { E.rcpt = ref('OBSDN'); go('/success'); };
}
function viewSuccess() {
  if (!guard()) return;
  app.innerHTML = `<div class="done-card">
    <div class="done-top">${tick()}<h1>Donation successful</h1><p>Thank you, ${esc(D.name)}. A receipt has been sent to ${esc(D.email)}.</p></div>
    <div class="done-body"><div class="amt"><small>Amount paid</small><b>${sgd(D.amount)}</b></div>
    ${rows([['Receipt no.', E.rcpt], ['Service', esc(D.service)], ['Payment method', method], ['Status', '<span class="badge ok">PAID</span>']])}
    <div class="btns"><button class="btn ghost" onclick="window.print()">Print receipt</button><button class="btn" onclick="resetAll()">Make another donation</button></div></div></div>`;
}

/* ---------- eGIRO flow: simulated bank page + return page ---------- */
function viewBank() {
  if (!guard() || !E.bank) return go('/');
  const start = new Date(), end = new Date(E.end + '-28');
  app.innerHTML = `<div class="bank"><div class="demo">DEMO: this page represents ${esc(E.bank)}'s own website. Each bank designs its own.</div>
  <div class="bh">${esc(E.bank)} · Internet Banking</div><div class="bb" id="bk">
    <h3 style="margin-top:0">Step A: Log in</h3>
    <div class="f"><label>User ID</label><input placeholder="User ID"></div>
    <div class="f"><label>PIN / password</label><input type="password" placeholder="PIN"></div>
    <div class="f"><label>One-time code (SMS / token)</label><input placeholder="6-digit code"></div>
    <button class="btn" id="login">Log in</button><p class="sub" style="margin-top:10px">HEB never sees these details.</p></div></div>`;
  $('#login').onclick = () => {
    $('#bk').innerHTML = `<h3 style="margin-top:0">Step B: Approve direct debit</h3>
    <table class="sum"><tr><td>Billing organisation</td><td>HEB - Sri Sivan Temple</td></tr><tr><td>Reference</td><td>${E.ref}</td></tr><tr><td>Maximum per debit</td><td>${sgd(E.amount)}</td></tr><tr><td>Valid from / to</td><td>${fmt(start)} - ${fmt(end)}</td></tr></table><br>
    <div class="f"><label>Debit from account</label><select><option>Savings ···· 1234</option><option>Current ···· 5678</option></select></div>
    <div style="display:flex;gap:10px"><button class="btn ghost" id="rej">Reject</button><button class="btn" id="apr">Approve</button></div>`;
    $('#apr').onclick = () => { E.status = 'ACTIVE'; go('/egiro-return'); };
    $('#rej').onclick = () => { E.status = 'REJECTED'; go('/egiro-return'); };
  };
}
function nextDebit() { const d = new Date(); d.setDate(E.day); if (d <= new Date()) d.setMonth(d.getMonth() + 1); return d; }
function viewReturn() {
  if (!guard() || !E.status) return go('/');
  const ok = E.status === 'ACTIVE';
  const first = fmt(nextDebit());
  app.innerHTML = `<div class="done-card">
    <div class="done-top ${ok ? '' : 'warn'}">${tick(ok)}<h1>${ok ? 'Auto-debit set up' : 'Auto-debit not approved'}</h1>
    <p>${ok ? `Your monthly donation is now active. First collection on <b>${first}</b>. Nothing has been debited today.` : 'You did not approve the permission at your bank. No money was taken.'}</p></div>
    <div class="done-body">
    ${ok ? `<div class="amt"><small>Per month (maximum)</small><b>${sgd(E.amount)}</b></div>
    ${rows([['Mandate reference', E.ref], ['Status', '<span class="badge ok">ACTIVE</span>'], ['Service', esc(D.service)], ['Bank', `${esc(E.bank)} (${E.segment})`], ['Debit day', `${ord(E.day)} of each month`], ['Valid until', `${MONTHS[+E.end.slice(5) - 1]} ${E.end.slice(0, 4)}`]])}
    <h4 class="nx">What happens next</h4>
    <ol class="flow"><li class="d"><b>Permission approved</b><span>Confirmed at your bank</span></li><li class="d"><b>Mandate active</b><span>Reference ${E.ref}</span></li><li><b>First collection</b><span>${first}</span></li><li><b>Receipt each month</b><span>Emailed to ${esc(D.email)} after every debit</span></li></ol>
    <p class="fine">You can cancel this permission anytime from your bank's internet banking.</p>` : ''}
    <div class="btns">${ok ? '<button class="btn ghost" onclick="window.print()">Print summary</button>' : '<button class="btn ghost" onclick="retryEgiro()">Try again</button>'}<button class="btn" onclick="resetAll()">${ok ? 'Done' : 'Back to donation'}</button></div></div></div>`;
}
window.retryEgiro = () => { E.status = ''; go('/'); setTimeout(openEgiro, 50); };
window.resetAll = () => {
  Object.assign(D, { amount: '', name: '', email: '', mobile: '', office: '', nric: '', block: '', unit: '', street: '', postal: '', remark: '' });
  E.end = ''; E.status = ''; go('/');
};
window.go = go;

/* ---------- router ---------- */
const routes = { '/': viewDonation, '/payment': viewPayment, '/paynow': viewPayNow, '/enets': viewEnets, '/success': viewSuccess, '/bank': viewBank, '/egiro-return': viewReturn };
function route() { closeModal(); const p = location.hash.slice(1) || '/'; (routes[p] || viewDonation)(); window.scrollTo(0, 0); }
window.addEventListener('hashchange', route);
route();
