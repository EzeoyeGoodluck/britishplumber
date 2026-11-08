/* The British Plumber — site behaviour */
(function () {
  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Services dropdown (click/tap support; hover works on desktop via CSS)
  document.querySelectorAll('.has-dropdown > button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var li = btn.parentElement;
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.has-dropdown.open').forEach(function (li) {
      if (!li.contains(e.target)) { li.classList.remove('open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); }
    });
  });

  // Contact form → emailed via FormSubmit (formsubmit.co).
  // The very first submission sends an activation email to the inbox; after it is
  // confirmed, every message arrives as an email.
  document.querySelectorAll('form[data-contact-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var email = form.getAttribute('data-email');
    var phone = form.getAttribute('data-phone');
    var endpoint = 'https://formsubmit.co/ajax/' + (form.getAttribute('data-formsubmit') || email);

    function show(type, msg) { status.className = 'form-status is-' + type; status.textContent = msg; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      if (data.get('botcheck')) return; // spam honeypot

      var payload = {
        Name: data.get('name'),
        'Post code': data.get('postcode'),
        Phone: data.get('phone'),
        Email: data.get('email'),
        Message: data.get('message') || '',
        _subject: 'New website enquiry — ' + data.get('name') + ' (' + data.get('postcode') + ')',
        _replyto: data.get('email'),
        _template: 'table',
        _captcha: 'false'
      };

      button.disabled = true;
      var label = button.textContent;
      button.textContent = 'Sending…';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var msg = String(res.message || '');
          if (/activat/i.test(msg)) {
            show('success', 'Form not activated yet — check ' + email + ' for the FormSubmit activation email and click the link.');
            return;
          }
          if (String(res.success) !== 'true') throw new Error(msg || 'Failed');
          form.reset();
          show('success', 'Thanks, your message has been sent. We’ll get back to you the same working day.');
        })
        .catch(function () {
          show('error', 'Sorry, that didn’t send. Please call ' + phone + ' or email ' + email + '.');
        })
        .finally(function () { button.disabled = false; button.textContent = label; });
    });
  });
})();
