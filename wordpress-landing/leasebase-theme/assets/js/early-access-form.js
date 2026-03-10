/**
 * LeaseBase — Early Access Form Handler
 *
 * Submits the form via the WP REST API (leasebase/v1/early-access).
 * Config is injected via wp_localize_script as `lbForm`.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('lb-early-access-form');
    if (!form) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var msgEl = document.getElementById('lb-form-message');
    var originalBtnText = submitBtn ? submitBtn.textContent : 'Request Early Access';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear previous messages
      if (msgEl) {
        msgEl.className = '';
        msgEl.style.display = 'none';
        msgEl.textContent = '';
      }

      // Gather values
      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var role = form.querySelector('[name="role"]');
      var units = form.querySelector('[name="units"]');

      if (!name || !email || !role || !units) return;

      // Basic client-side validation
      if (!name.value.trim()) {
        showMessage('Please enter your name.', 'error');
        name.focus();
        return;
      }
      if (!email.value.trim() || !isValidEmail(email.value)) {
        showMessage('Please enter a valid email address.', 'error');
        email.focus();
        return;
      }
      if (!role.value) {
        showMessage('Please select your role.', 'error');
        role.focus();
        return;
      }
      if (!units.value.trim()) {
        showMessage('Please enter the number of units you manage.', 'error');
        units.focus();
        return;
      }

      // Disable button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
      }

      // Submit via REST API
      fetch(lbForm.restUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': lbForm.nonce,
        },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          role: role.value,
          units: units.value.trim(),
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { status: res.status, data: data };
          });
        })
        .then(function (result) {
          if (result.data.success) {
            showMessage(result.data.message, 'success');
            form.reset();
          } else {
            showMessage(
              result.data.message || 'Something went wrong. Please try again.',
              'error'
            );
          }
        })
        .catch(function () {
          showMessage(
            'Network error. Please check your connection and try again.',
            'error'
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    });

    function showMessage(text, type) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = type === 'success' ? 'lb-success' : 'lb-error';
      msgEl.style.display = 'block';
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  });
})();
