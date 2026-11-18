/**
 * ClaimCare — User Dashboard & Profile Module
 * Handles dynamic KPI summary cards, recent claims table, activity feed, and profile updates.
 */
(function (window) {
  'use strict';

  var CC = window.ClaimCare;

  /**
   * Renders personalized summary statistics, recent claims, and activity log on dashboard.html.
   */
  function initUserDashboard() {
    var welcomeEl = document.getElementById('dashboardWelcome');
    if (!welcomeEl) return;

    var user = window.ClaimCareAuth.requireAuth();
    if (!user) return;

    window.ClaimCareClaims.initClaimModalClose();

    welcomeEl.textContent = 'Welcome back, ' + user.fullName + '!';

    var userClaims = CC.getClaims().filter(function (c) {
      return user.role === 'admin' ? true : c.userId === user.id;
    });

    var total = userClaims.length;
    var pending = 0;
    var approved = 0;
    var rejected = 0;

    for (var i = 0; i < userClaims.length; i++) {
      var st = userClaims[i].status;
      if (st === 'Approved' || st === 'Settled') {
        approved++;
      } else if (st === 'Rejected') {
        rejected++;
      } else {
        pending++;
      }
    }

    document.getElementById('statTotalClaims').textContent = String(total);
    document.getElementById('statPendingClaims').textContent = String(pending);
    document.getElementById('statApprovedClaims').textContent = String(approved);
    document.getElementById('statRejectedClaims').textContent = String(rejected);

    var recentBody = document.getElementById('recentClaimsBody');
    var recentEmpty = document.getElementById('recentClaimsEmpty');
    var recentWrap = document.getElementById('recentClaimsWrap');

    var recentClaims = userClaims.slice().sort(function (a, b) {
      return b.submissionDate.localeCompare(a.submissionDate);
    }).slice(0, 5);

    if (recentClaims.length === 0) {
      if (recentWrap) recentWrap.classList.add('hidden');
      if (recentEmpty) recentEmpty.classList.remove('hidden');
    } else {
      if (recentWrap) recentWrap.classList.remove('hidden');
      if (recentEmpty) recentEmpty.classList.add('hidden');

      recentBody.innerHTML = recentClaims.map(function (c) {
        var statusClass = (c.status === 'Approved' || c.status === 'Settled')
          ? 'status-text status-text--teal'
          : 'status-text';
        return '<tr>' +
          '<td class="tabular"><strong>' + CC.escapeHTML(c.id) + '</strong></td>' +
          '<td>' + CC.escapeHTML(c.insuranceType + ' (' + c.claimType + ')') + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(c.submissionDate) + '</td>' +
          '<td class="cell-amount">' + CC.formatCurrency(c.claimAmount) + '</td>' +
          '<td><span class="' + statusClass + '">' + CC.escapeHTML(c.status) + '</span></td>' +
          '<td>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-view-claim="' + CC.escapeHTML(c.id) + '">View Details</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      var viewBtns = recentBody.querySelectorAll('[data-view-claim]');
      for (var j = 0; j < viewBtns.length; j++) {
        viewBtns[j].addEventListener('click', function () {
          window.ClaimCareClaims.openClaimDetailsModal(this.getAttribute('data-view-claim'));
        });
      }
    }

    var activityList = document.getElementById('recentActivityList');
    if (activityList) {
      var activities = CC.getActivities().filter(function (a) {
        return user.role === 'admin' ? true : (!a.userId || a.userId === user.id);
      }).slice(0, 5);

      if (activities.length === 0) {
        activityList.innerHTML = '<li class="activity-item"><span>No recent account activity yet.</span></li>';
      } else {
        activityList.innerHTML = activities.map(function (a) {
          return '<li class="activity-item">' +
            '<span>' + CC.escapeHTML(a.action) + '</span>' +
            '<span class="activity-meta tabular">' + CC.escapeHTML(a.timestamp) + '</span>' +
          '</li>';
        }).join('');
      }
    }
  }

  /**
   * Initializes User Profile view/edit mode and LocalStorage persistence on profile.html.
   */
  function initProfilePage() {
    var profileForm = document.getElementById('profileForm');
    if (!profileForm) return;

    var user = window.ClaimCareAuth.requireAuth();
    if (!user) return;

    var fullNameInput = document.getElementById('profileFullName');
    var emailInput = document.getElementById('profileEmail');
    var phoneInput = document.getElementById('profilePhone');
    var addressInput = document.getElementById('profileAddress');
    var editBtn = document.getElementById('editProfileBtn');
    var saveBtn = document.getElementById('saveProfileBtn');
    var cancelBtn = document.getElementById('cancelProfileBtn');
    var noticeEl = document.getElementById('profileNotice');

    function populateFields(u) {
      fullNameInput.value = u.fullName || '';
      emailInput.value = u.email || '';
      phoneInput.value = u.phone || '';
      addressInput.value = u.address || '';
      var metaId = document.getElementById('profileAccountId');
      var metaRole = document.getElementById('profileAccountRole');
      var metaDate = document.getElementById('profileCreatedAt');
      if (metaId) metaId.textContent = u.id;
      if (metaRole) metaRole.textContent = u.role === 'admin' ? 'Administrator' : 'Policyholder';
      if (metaDate) metaDate.textContent = u.createdAt || '2026-01-15';
    }

    function setEditMode(editable) {
      fullNameInput.readOnly = !editable;
      emailInput.readOnly = !editable;
      phoneInput.readOnly = !editable;
      addressInput.readOnly = !editable;

      if (editable) {
        editBtn.classList.add('hidden');
        saveBtn.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
        fullNameInput.focus();
      } else {
        editBtn.classList.remove('hidden');
        saveBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
      }
    }

    populateFields(user);
    setEditMode(false);

    if (editBtn) {
      editBtn.addEventListener('click', function () {
        CC.hideNotice(noticeEl);
        setEditMode(true);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var latestUser = CC.getCurrentUser() || user;
        populateFields(latestUser);
        setEditMode(false);
        CC.hideNotice(noticeEl);
      });
    }

    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      CC.hideNotice(noticeEl);

      var newName = fullNameInput.value.trim();
      var newEmail = emailInput.value.trim().toLowerCase();
      var newPhone = phoneInput.value.trim();
      var newAddress = addressInput.value.trim();
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (newName.length < 2 || !emailRegex.test(newEmail) || newPhone.replace(/\D/g, '').length < 10 || !newAddress) {
        CC.showNotice(noticeEl, 'Please provide a valid full name, email address, 10-digit phone number, and address.', 'navy');
        return;
      }

      var users = CC.getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].id !== user.id && users[i].email.toLowerCase() === newEmail) {
          CC.showNotice(noticeEl, 'That email address is already registered to another account.', 'navy');
          return;
        }
      }

      for (var j = 0; j < users.length; j++) {
        if (users[j].id === user.id) {
          users[j].fullName = newName;
          users[j].email = newEmail;
          users[j].phone = newPhone;
          users[j].address = newAddress;
          user = users[j];
          break;
        }
      }

      CC.saveUsers(users);
      var session = CC.getSession();
      if (session) {
        session.fullName = user.fullName;
        session.email = user.email;
        CC.setSession(session);
      }

      var nameEls = document.querySelectorAll('[data-user-name]');
      for (var k = 0; k < nameEls.length; k++) {
        nameEls[k].textContent = user.fullName;
      }

      CC.addActivity(user.id, '', 'Updated personal profile information.');
      setEditMode(false);
      CC.showNotice(noticeEl, 'Profile changes saved to LocalStorage.', 'teal');
    });

    // Optional demo password update form
    var passForm = document.getElementById('changePasswordForm');
    var passNotice = document.getElementById('passwordNotice');
    if (passForm) {
      passForm.addEventListener('submit', function (e) {
        e.preventDefault();
        CC.hideNotice(passNotice);

        var currentPass = document.getElementById('currentPassword').value;
        var newPass = document.getElementById('newPassword').value;
        var confirmPass = document.getElementById('confirmNewPassword').value;

        var freshUser = CC.getCurrentUser();
        if (!freshUser || currentPass !== freshUser.password) {
          CC.showNotice(passNotice, 'Current password does not match.', 'navy');
          return;
        }
        if (newPass.length < 6) {
          CC.showNotice(passNotice, 'New password must be at least 6 characters.', 'navy');
          return;
        }
        if (newPass !== confirmPass) {
          CC.showNotice(passNotice, 'New password confirmation does not match.', 'navy');
          return;
        }

        var users = CC.getUsers();
        for (var i = 0; i < users.length; i++) {
          if (users[i].id === freshUser.id) {
            users[i].password = newPass;
            break;
          }
        }
        CC.saveUsers(users);
        passForm.reset();
        CC.showNotice(passNotice, 'Demo password updated successfully.', 'teal');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initUserDashboard();
    initProfilePage();
  });
})(window);
