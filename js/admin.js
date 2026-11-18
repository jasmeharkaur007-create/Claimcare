/**
 * ClaimCare — Admin Console Module (Frontend Simulation)
 * Handles admin authentication guard, overview statistics, claim filtering, status transitions, remarks, and users table.
 */
(function (window) {
  'use strict';

  var CC = window.ClaimCare;

  function initAdminDashboard() {
    var adminRoot = document.getElementById('adminClaimsSection');
    if (!adminRoot) return;

    var user = CC.getCurrentUser();
    var accessWall = document.getElementById('adminAccessWall');
    var switchAdminBtn = document.getElementById('switchToDemoAdminBtn');
    var adminWorkspace = document.getElementById('adminWorkspace');

    if (!user || user.role !== 'admin') {
      if (accessWall) accessWall.classList.remove('hidden');
      if (adminWorkspace) adminWorkspace.classList.add('hidden');
      if (switchAdminBtn) {
        switchAdminBtn.addEventListener('click', function () {
          var users = CC.getUsers();
          var adminUser = null;
          for (var i = 0; i < users.length; i++) {
            if (users[i].role === 'admin') {
              adminUser = users[i];
              break;
            }
          }
          if (adminUser) {
            CC.setSession({
              userId: adminUser.id,
              email: adminUser.email,
              fullName: adminUser.fullName,
              role: 'admin',
              rememberMe: true,
              loginAt: new Date().toISOString()
            });
            window.location.reload();
          }
        });
      }
      return;
    }

    if (accessWall) accessWall.classList.add('hidden');
    if (adminWorkspace) adminWorkspace.classList.remove('hidden');

    var activeView = 'overview';
    var searchInput = document.getElementById('adminSearchInput');
    var typeFilter = document.getElementById('adminTypeFilter');
    var statusFilter = document.getElementById('adminStatusFilter');
    var claimsTableBody = document.getElementById('adminClaimsTableBody');
    var claimsEmpty = document.getElementById('adminClaimsEmpty');
    var claimsWrap = document.getElementById('adminClaimsWrap');
    var usersSection = document.getElementById('adminUsersSection');
    var usersTableBody = document.getElementById('adminUsersTableBody');
    var viewHeading = document.getElementById('adminViewHeading');
    var adminNotice = document.getElementById('adminNotice');

    // Modal elements
    var modal = document.getElementById('adminProcessModal');
    var closeModalBtn = document.getElementById('closeAdminModal');
    var modalBody = document.getElementById('adminProcessBody');
    var modalForm = document.getElementById('adminProcessForm');
    var modalClaimIdInput = document.getElementById('adminEditClaimId');
    var modalStatusSelect = document.getElementById('adminEditStatus');
    var modalRemarksInput = document.getElementById('adminEditRemarks');

    function updateSummaryStats() {
      var claims = CC.getClaims();
      var total = claims.length;
      var underReview = 0;
      var approved = 0;
      var rejected = 0;

      for (var i = 0; i < claims.length; i++) {
        var st = claims[i].status;
        if (st === 'Submitted' || st === 'Under Review' || st === 'Documents Required') {
          underReview++;
        } else if (st === 'Approved' || st === 'Settled') {
          approved++;
        } else if (st === 'Rejected') {
          rejected++;
        }
      }

      document.getElementById('adminStatTotal').textContent = String(total);
      document.getElementById('adminStatReview').textContent = String(underReview);
      document.getElementById('adminStatApproved').textContent = String(approved);
      document.getElementById('adminStatRejected').textContent = String(rejected);
    }

    function renderUsersTable() {
      if (!usersTableBody) return;
      var users = CC.getUsers();
      var claims = CC.getClaims();

      usersTableBody.innerHTML = users.map(function (u) {
        var userClaimCount = claims.filter(function (c) { return c.userId === u.id; }).length;
        return '<tr>' +
          '<td class="tabular"><strong>' + CC.escapeHTML(u.id) + '</strong></td>' +
          '<td>' + CC.escapeHTML(u.fullName) + '</td>' +
          '<td>' + CC.escapeHTML(u.email) + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(u.phone) + '</td>' +
          '<td>' + CC.escapeHTML(u.role === 'admin' ? 'Administrator' : 'Policyholder') + '</td>' +
          '<td class="tabular">' + userClaimCount + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(u.createdAt || '2026-01-15') + '</td>' +
        '</tr>';
      }).join('');
    }

    function openManageModal(claimId) {
      var claims = CC.getClaims();
      var claim = claims.find(function (c) { return c.id === claimId; });
      if (!claim || !modal) return;

      var docs = CC.getDocuments().filter(function (d) { return d.claimId === claim.id; });
      var docsText = docs.length
        ? docs.map(function (d) { return d.name + ' (' + d.docType + ')'; }).join(', ')
        : 'No documents uploaded yet.';

      modalBody.innerHTML =
        '<div class="detail-grid">' +
          '<div class="detail-item"><span class="detail-label">Claim ID</span><span class="detail-value tabular">' + CC.escapeHTML(claim.id) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Customer Name</span><span class="detail-value">' + CC.escapeHTML(claim.fullName) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Policy Number</span><span class="detail-value tabular">' + CC.escapeHTML(claim.policyNumber) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Insurance Type</span><span class="detail-value">' + CC.escapeHTML(claim.insuranceType) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Claim Amount</span><span class="detail-value tabular">' + CC.formatCurrency(claim.claimAmount) + '</span></div>' +
          '<div class="detail-item"><span class="detail-label">Submission Date</span><span class="detail-value tabular">' + CC.escapeHTML(claim.submissionDate) + '</span></div>' +
        '</div>' +
        '<div class="notice notice--navy">' +
          '<span class="notice-title">Incident &amp; Documents Summary</span>' +
          '<p><strong>' + CC.escapeHTML(claim.claimType) + '</strong> (' + CC.escapeHTML(claim.incidentDate) + ' at ' + CC.escapeHTML(claim.incidentLocation) + '): ' + CC.escapeHTML(claim.description) + '</p>' +
          '<p><strong>Documents:</strong> ' + CC.escapeHTML(docsText) + '</p>' +
        '</div>';

      modalClaimIdInput.value = claim.id;
      modalStatusSelect.value = claim.status;
      modalRemarksInput.value = claim.remarks || '';
      modal.classList.remove('hidden');
    }

    function renderClaimsTable() {
      if (!claimsTableBody) return;
      var claims = CC.getClaims();
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var selectedType = typeFilter ? typeFilter.value : 'all';
      var selectedStatus = statusFilter ? statusFilter.value : 'all';

      var filtered = claims.filter(function (c) {
        if (activeView === 'pending' && c.status !== 'Submitted' && c.status !== 'Under Review' && c.status !== 'Documents Required') {
          return false;
        }
        if (activeView === 'approved' && c.status !== 'Approved' && c.status !== 'Settled') {
          return false;
        }
        if (activeView === 'rejected' && c.status !== 'Rejected') {
          return false;
        }

        var matchesQuery = !query ||
          c.id.toLowerCase().indexOf(query) !== -1 ||
          c.fullName.toLowerCase().indexOf(query) !== -1 ||
          c.policyNumber.toLowerCase().indexOf(query) !== -1;
        var matchesType = selectedType === 'all' || c.insuranceType === selectedType;
        var matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
        return matchesQuery && matchesType && matchesStatus;
      });

      if (filtered.length === 0) {
        if (claimsWrap) claimsWrap.classList.add('hidden');
        if (claimsEmpty) claimsEmpty.classList.remove('hidden');
        claimsTableBody.innerHTML = '';
        return;
      }

      if (claimsWrap) claimsWrap.classList.remove('hidden');
      if (claimsEmpty) claimsEmpty.classList.add('hidden');

      claimsTableBody.innerHTML = filtered.map(function (c) {
        var statusClass = (c.status === 'Approved' || c.status === 'Settled')
          ? 'status-text status-text--teal'
          : 'status-text';
        return '<tr>' +
          '<td class="tabular"><strong>' + CC.escapeHTML(c.id) + '</strong></td>' +
          '<td>' + CC.escapeHTML(c.fullName) + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(c.policyNumber) + '</td>' +
          '<td>' + CC.escapeHTML(c.insuranceType) + '</td>' +
          '<td class="cell-amount">' + CC.formatCurrency(c.claimAmount) + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(c.submissionDate) + '</td>' +
          '<td><span class="' + statusClass + '">' + CC.escapeHTML(c.status) + '</span></td>' +
          '<td>' +
            '<button type="button" class="btn btn--primary btn--sm" data-manage-claim="' + CC.escapeHTML(c.id) + '">Manage</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      var manageBtns = claimsTableBody.querySelectorAll('[data-manage-claim]');
      for (var i = 0; i < manageBtns.length; i++) {
        manageBtns[i].addEventListener('click', function () {
          openManageModal(this.getAttribute('data-manage-claim'));
        });
      }
    }

    function setAdminView(viewName) {
      activeView = viewName;
      var navBtns = document.querySelectorAll('[data-admin-view]');
      for (var i = 0; i < navBtns.length; i++) {
        var isMatch = navBtns[i].getAttribute('data-admin-view') === viewName;
        navBtns[i].classList.toggle('active', isMatch);
      }

      if (viewName === 'users') {
        adminRoot.classList.add('hidden');
        usersSection.classList.remove('hidden');
        if (viewHeading) viewHeading.textContent = 'Registered Policyholders & Administrators';
        renderUsersTable();
      } else {
        usersSection.classList.add('hidden');
        adminRoot.classList.remove('hidden');
        var titles = {
          overview: 'All Received Claims',
          all: 'All Claims Directory',
          pending: 'Pending & Under Review Claims',
          approved: 'Approved & Settled Claims',
          rejected: 'Rejected Claims'
        };
        if (viewHeading) viewHeading.textContent = titles[viewName] || 'All Received Claims';
        if (statusFilter) statusFilter.value = 'all';
        renderClaimsTable();
      }

      // Close mobile sidebar after selection
      var sidebar = document.getElementById('portalSidebar');
      var backdrop = document.getElementById('sidebarBackdrop');
      if (sidebar) sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
    }

    var sidebarViewBtns = document.querySelectorAll('[data-admin-view]');
    for (var j = 0; j < sidebarViewBtns.length; j++) {
      sidebarViewBtns[j].addEventListener('click', function () {
        setAdminView(this.getAttribute('data-admin-view'));
      });
    }

    if (searchInput) searchInput.addEventListener('input', renderClaimsTable);
    if (typeFilter) typeFilter.addEventListener('change', renderClaimsTable);
    if (statusFilter) statusFilter.addEventListener('change', renderClaimsTable);

    // Quick status action buttons inside Admin Process Modal
    var quickActionBtns = document.querySelectorAll('[data-quick-status]');
    for (var k = 0; k < quickActionBtns.length; k++) {
      quickActionBtns[k].addEventListener('click', function () {
        var newStatus = this.getAttribute('data-quick-status');
        if (modalStatusSelect) modalStatusSelect.value = newStatus;
        if (newStatus === 'Documents Required' && modalRemarksInput && !modalRemarksInput.value.trim()) {
          modalRemarksInput.value = 'Please upload clear copies of supporting bills and identity verification documents.';
        }
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', function () {
        modal.classList.add('hidden');
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (modalForm) {
      modalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var cid = modalClaimIdInput.value;
        var nextStatus = modalStatusSelect.value;
        var nextRemarks = modalRemarksInput.value.trim();

        var claims = CC.getClaims();
        var target = null;
        for (var i = 0; i < claims.length; i++) {
          if (claims[i].id === cid) {
            claims[i].status = nextStatus;
            claims[i].stage = CC.STATUS_STAGE_MAP[nextStatus] || 1;
            claims[i].remarks = nextRemarks;
            claims[i].lastUpdated = CC.getTodayISO();
            target = claims[i];
            break;
          }
        }

        if (target) {
          CC.saveClaims(claims);
          CC.addActivity(
            target.userId,
            target.id,
            'Administrator updated claim ' + target.id + ' status to "' + nextStatus + '".'
          );
          CC.showNotice(adminNotice, 'Claim ' + target.id + ' updated to "' + nextStatus + '". Changes are reflected in customer tracking.', 'teal');
        }

        modal.classList.add('hidden');
        updateSummaryStats();
        renderClaimsTable();
      });
    }

    updateSummaryStats();
    setAdminView('overview');
  }

  document.addEventListener('DOMContentLoaded', initAdminDashboard);
})(window);
