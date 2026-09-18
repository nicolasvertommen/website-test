(function () {
  'use strict';

  var CHAT_ENDPOINT = '/.netlify/functions/chat';
  var LEAD_ENDPOINT = '/.netlify/functions/lead';
  var GREETING =
    'Hoi! Ik ben de Nero-assistent. Vraag me gerust iets over onze stations, tarieven of hoe het huren werkt.';
  var LEAD_AFTER_REPLIES = 2;

  var messages = [];
  var busy = false;
  var leadShown = false;
  var leadDone = false;
  var replyCount = 0;

  var root, panel, log, form, input, sendBtn, launcher;

  function friendly(message) {
    var error = new Error(message);
    error.friendly = true;
    return error;
  }

  // Netlify kan bij een storing HTML terugsturen in plaats van JSON — vang dat op
  // zodat de bezoeker nooit een parse-fout te zien krijgt.
  function readJson(res) {
    return res.text().then(function (body) {
      var data = null;
      try {
        data = JSON.parse(body);
      } catch (err) {
        data = null;
      }
      if (!res.ok) {
        throw friendly(
          (data && data.error) ||
            'De assistent is even niet bereikbaar. Probeer het zo opnieuw.',
        );
      }
      if (!data) {
        throw friendly(
          'De assistent gaf een onverwacht antwoord. Probeer het zo opnieuw.',
        );
      }
      return data;
    });
  }

  function errorText(error) {
    if (error && error.friendly) return error.message;
    return 'Geen verbinding met de assistent. Controleer je internetverbinding en probeer het opnieuw.';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function scrollToBottom() {
    log.scrollTop = log.scrollHeight;
  }

  function addBubble(role, text) {
    var row = el('div', 'nchat-row nchat-row-' + role);
    row.appendChild(el('div', 'nchat-bubble nchat-bubble-' + role, text));
    log.appendChild(row);
    scrollToBottom();
    return row;
  }

  function addTyping() {
    var row = el('div', 'nchat-row nchat-row-assistant');
    var bubble = el('div', 'nchat-bubble nchat-bubble-assistant nchat-typing');
    for (var i = 0; i < 3; i++) bubble.appendChild(el('span'));
    row.appendChild(bubble);
    log.appendChild(row);
    scrollToBottom();
    return row;
  }

  function addNotice(text) {
    var row = el('div', 'nchat-notice', text);
    log.appendChild(row);
    scrollToBottom();
  }

  function setBusy(state) {
    busy = state;
    input.disabled = state;
    sendBtn.disabled = state;
  }

  function showLeadCapture() {
    if (leadShown || leadDone) return;
    leadShown = true;

    var card = el('div', 'nchat-lead');
    card.appendChild(
      el(
        'p',
        'nchat-lead-title',
        'Wil je dat we hier persoonlijk op terugkomen?',
      ),
    );
    card.appendChild(
      el(
        'p',
        'nchat-lead-sub',
        'Laat je e-mailadres achter — we gebruiken het enkel om je vraag te beantwoorden.',
      ),
    );

    var leadForm = el('form', 'nchat-lead-form');
    var leadInput = el('input', 'nchat-lead-input');
    leadInput.type = 'email';
    leadInput.placeholder = 'jij@voorbeeld.be';
    leadInput.required = true;
    leadInput.setAttribute('aria-label', 'E-mailadres');

    var leadBtn = el('button', 'nchat-lead-btn', 'Versturen');
    leadBtn.type = 'submit';

    leadForm.appendChild(leadInput);
    leadForm.appendChild(leadBtn);
    card.appendChild(leadForm);

    var skip = el('button', 'nchat-lead-skip', 'Nee, bedankt');
    skip.type = 'button';
    skip.addEventListener('click', function () {
      leadDone = true;
      card.remove();
    });
    card.appendChild(skip);

    var privacy = el('p', 'nchat-lead-privacy');
    var privacyLink = el('a', null, 'Privacybeleid');
    privacyLink.href = 'privacybeleid.html';
    privacyLink.target = '_blank';
    privacyLink.rel = 'noopener';
    privacy.appendChild(document.createTextNode('Zie ons '));
    privacy.appendChild(privacyLink);
    privacy.appendChild(document.createTextNode('.'));
    card.appendChild(privacy);

    leadForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = leadInput.value.trim();
      if (!email) return;

      leadBtn.disabled = true;
      leadInput.disabled = true;
      leadBtn.textContent = 'Versturen…';

      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, messages: messages }),
      })
        .then(readJson)
        .then(function () {
          leadDone = true;
          card.remove();
          addNotice('Bedankt — we nemen zo snel mogelijk contact met je op.');
        })
        .catch(function (error) {
          leadBtn.disabled = false;
          leadInput.disabled = false;
          leadBtn.textContent = 'Versturen';
          var existing = card.querySelector('.nchat-lead-error');
          if (existing) existing.remove();
          card.appendChild(el('p', 'nchat-lead-error', errorText(error)));
        });
    });

    log.appendChild(card);
    scrollToBottom();
  }

  function send(text) {
    messages.push({ role: 'user', content: text });
    addBubble('user', text);

    setBusy(true);
    var typing = addTyping();

    fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages }),
    })
      .then(readJson)
      .then(function (data) {
        typing.remove();
        messages.push({ role: 'assistant', content: data.reply });
        addBubble('assistant', data.reply);
        replyCount++;
        if (replyCount >= LEAD_AFTER_REPLIES) showLeadCapture();
      })
      .catch(function (error) {
        typing.remove();
        addNotice(errorText(error));
      })
      .finally(function () {
        setBusy(false);
        if (panel.classList.contains('nchat-open')) input.focus();
      });
  }

  function togglePanel(open) {
    panel.classList.toggle('nchat-open', open);
    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (log.childElementCount === 0) addBubble('assistant', GREETING);
      input.focus();
    }
  }

  function build() {
    root = el('div', 'nchat');

    launcher = el('button', 'nchat-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Open de Nero-assistent');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.8L3 21l1.9-5a8.4 8.4 0 0 1-.8-3.6 8.4 8.4 0 0 1 8.4-8.4h.5a8.4 8.4 0 0 1 8 8Z"/></svg>';

    panel = el('div', 'nchat-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Nero-assistent');

    var header = el('div', 'nchat-header');
    var heading = el('div', 'nchat-heading');
    heading.appendChild(el('strong', null, 'Nero-assistent'));
    heading.appendChild(el('span', 'nchat-ai-label', 'Je chat met een AI-assistent'));
    header.appendChild(heading);

    var close = el('button', 'nchat-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Sluit de chat');
    close.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    header.appendChild(close);
    panel.appendChild(header);

    log = el('div', 'nchat-log');
    panel.appendChild(log);

    form = el('form', 'nchat-form');
    input = el('input', 'nchat-input');
    input.type = 'text';
    input.placeholder = 'Stel je vraag…';
    input.maxLength = 1000;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Je bericht');

    sendBtn = el('button', 'nchat-send');
    sendBtn.type = 'submit';
    sendBtn.setAttribute('aria-label', 'Verstuur');
    sendBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

    form.appendChild(input);
    form.appendChild(sendBtn);
    panel.appendChild(form);

    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    launcher.addEventListener('click', function () {
      togglePanel(!panel.classList.contains('nchat-open'));
    });
    close.addEventListener('click', function () {
      togglePanel(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && panel.classList.contains('nchat-open')) {
        togglePanel(false);
      }
    });
    function submitMessage() {
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = '';
      send(text);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitMessage();
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitMessage();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
