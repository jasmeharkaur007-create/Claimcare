/**
 * ClaimCare — Demo Authentication Module
 * Handles registration validation, login verification, forgot password simulation, and route guards.
 */
(function (window) {
  'use strict';

  var CC = window.ClaimCare;

  /**
   * Ensures only authenticated users can access customer portal pages.
   */
  function requireAuth(expectedRole) {
    var user = CC.getCurrentUser();
    if (!user) {
      var page = window.location.pathname.split('/').pop() || 'dashboard.html';
      window.location.href = 'login.html?redirect=' + encodeURIComponent(page);
      return null;
    }
    if (expectedRole && user.role !== expectedRole) {
      return user;
    }
    return user;
  }

  function setFieldError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg || '';
  }

  function clearErrors(ids) {
    for (var i = 0; i < ids.length; i++) {
      setFieldError(ids[i], '');
    }
  }

  /**
   * Handles new demo user registration with field-level validation.
   */
  function initRegisterForm() {
    var form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errorIds = ['errFullName', 'errRegEmail', 'errPhone', 'errRegPassword', 'errConfirmPassword'];
      clearErrors(errorIds);

      var noticeEl = document.getElementById('registerNotice');
      CC.hideNotice(noticeEl);

      var fullName = document.getElementById('regFullName').value.trim();
      var email = document.getElementById('regEmail').value.trim().toLowerCase();
      var phone = document.getElementById('regPhone').value.trim();
      var password = document.getElementById('regPassword').value;
      var confirmPassword = document.getElementById('regConfirmPassword').value;

      var valid = true;
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var phoneDigits = phone.replace(/\D/g, '');

      if (fullName.length < 2) {
        setFieldError('errFullName', 'Please enter your full name.');
        valid = false;
      }
      if (!emailRegex.test(email)) {
        setFieldError('errRegEmail', 'Please enter a valid email address.');
        valid = false;
      }
      if (phoneDigits.length < 10) {
        setFieldError('errPhone', 'Please enter a valid 10-digit phone number.');
        valid = false;
      }
      if (password.length < 6) {
        setFieldError('errRegPassword', 'Password must be at least 6 characters.');
        valid = false;
      }
      if (password !== confirmPassword) {
        setFieldError('errConfirmPassword', 'Passwords do not match.');
        valid = false;
      }

      if (!valid) return;

      var users = CC.getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email) {
          setFieldError('errRegEmail', 'An account with this email already exists.');
          return;
        }
      }

      var newUser = {
        id: 'USR' + (1001 + users.length),
        fullName: fullName,
        email: email,
        phone: phone,
        address: 'Not provided yet — update in Profile',
        password: password,
        role: 'customer',
        createdAt: CC.getTodayISO()
      };

      users.push(newUser);
      CC.saveUsers(users);
      CC.setSession({
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        rememberMe: true,
        loginAt: new Date().toISOString()
      });

      CC.addActivity(newUser.id, '', 'Registered new ClaimCare demo account.');
      CC.showNotice(noticeEl, 'Registration successful. Redirecting to your dashboard...', 'teal');

      window.setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 600);
    });
  }

  /**
   * Handles demo user and admin login, Remember Me, and Forgot Password modal.
   */
  function initLoginForm() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    var rememberedEmail = localStorage.getItem('cc_remember_email');
    var emailInput = document.getElementById('loginEmail');
    var rememberCheckbox = document.getElementById('rememberMe');
    if (rememberedEmail && emailInput) {
      emailInput.value = rememberedEmail;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    var fillCustomerBtn = document.getElementById('fillDemoCustomer');
    if (fillCustomerBtn) {
      fillCustomerBtn.addEventListener('click', function () {
        document.getElementById('loginEmail').value = 'customer@claimcare.demo';
        document.getElementById('loginPassword').value = 'Password123';
      });
    }

    var fillAdminBtn = document.getElementById('fillDemoAdmin');
    if (fillAdminBtn) {
      fillAdminBtn.addEventListener('click', function () {
        document.getElementById('loginEmail').value = 'admin@claimcare.demo';
        document.getElementById('loginPassword').value = 'Admin123';
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(['errLoginEmail', 'errLoginPassword']);
      var noticeEl = document.getElementById('loginNotice');
      CC.hideNotice(noticeEl);

      var email = document.getElementById('loginEmail').value.trim().toLowerCase();
      var password = document.getElementById('loginPassword').value;
      var rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      var valid = true;
      if (!emailRegex.test(email)) {
        setFieldError('errLoginEmail', 'Please enter a valid email address.');
        valid = false;
      }
      if (!password) {
        setFieldError('errLoginPassword', 'Please enter your password.');
        valid = false;
      }
      if (!valid) return;

      var users = CC.getUsers();
      var matched = null;
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === email && users[i].password === password) {
          matched = users[i];
          break;
        }
      }

      if (!matched) {
        CC.showNotice(noticeEl, 'Invalid email address or password. Try the demo credentials below or register a new account.', 'navy');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('cc_remember_email', matched.email);
      } else {
        localStorage.removeItem('cc_remember_email');
      }

      CC.setSession({
        userId: matched.id,
        email: matched.email,
        fullName: matched.fullName,
        role: matched.role,
        rememberMe: rememberMe,
        loginAt: new Date().toISOString()
      });

      var redirectTarget = CC.getQueryParam('redirect');
      if (matched.role === 'admin') {
        window.location.href = 'admin.html';
      } else if (redirectTarget && redirectTarget.indexOf('.html') !== -1) {
        window.location.href = redirectTarget;
      } else {
        window.location.href = 'dashboard.html';
      }
    });

    // Forgot Password inline simulation
    var forgotLink = document.getElementById('forgotPasswordLink');
    var forgotModal = document.getElementById('forgotModal');
    var closeForgot = document.getElementById('closeForgotModal');
    var forgotForm = document.getElementById('forgotForm');

    if (forgotLink && forgotModal) {
      forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        forgotModal.classList.remove('hidden');
      });
    }
    if (closeForgot && forgotModal) {
      closeForgot.addEventListener('click', function () {
        forgotModal.classList.add('hidden');
      });
    }
    if (forgotForm) {
      forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var resetEmail = document.getElementById('forgotEmail').value.trim().toLowerCase();
        var resetPass = document.getElementById('forgotNewPassword').value;
        var forgotNotice = document.getElementById('forgotNotice');

        if (!resetEmail || resetPass.length < 6) {
          CC.showNotice(forgotNotice, 'Enter a registered email and a new password of at least 6 characters.', 'navy');
          return;
        }

        var users = CC.getUsers();
        var found = false;
        for (var i = 0; i < users.length; i++) {
          if (users[i].email.toLowerCase() === resetEmail) {
            users[i].password = resetPass;
            found = true;
            break;
          }
        }
        if (!found) {
          CC.showNotice(forgotNotice, 'No demo account matches that email address.', 'navy');
          return;
        }

        CC.saveUsers(users);
        CC.showNotice(forgotNotice, 'Demo password updated. You can now log in with your new password.', 'teal');
        forgotForm.reset();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initRegisterForm();
    initLoginForm();
  });

  window.ClaimCareAuth = {
    requireAuth: requireAuth
  };
})(window);
