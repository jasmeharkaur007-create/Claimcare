/**
 * ClaimCare — Claims Management Module
 * Handles claim submission, draft saving, My Claims filtering, Claim Progress Tracking, and Documents.
 */
(function (window) {
  'use strict';

  var CC = window.ClaimCare;
  var ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
  var MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

  /**
   * Validates an HTML file input against allowed extensions and 5 MB limit.
   */
  function validateFileInput(inputEl, isRequired) {
    if (!inputEl) return { valid: true, file: null };
    var file = inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;
    if (!file) {
      if (isRequired) {
        return { valid: false, error: 'Please select a file for this required document.' };
      }
      return { valid: true, file: null };
    }
    var parts = file.name.split('.');
    var ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
    if (ALLOWED_EXTENSIONS.indexOf(ext) === -1) {
      return { valid: false, error: 'Allowed file types: PDF, JPG, JPEG, PNG.' };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { valid: false, error: 'File size must not exceed 5 MB.' };
    }
    return { valid: true, file: file };
  }

  /**
   * Generates a sequential unique Claim ID such as CLM1007.
   */
  function generateClaimId(claims) {
    var maxNum = 1000;
    for (var i = 0; i < claims.length; i++) {
      var match = /^CLM(\d+)$/.exec(claims[i].id);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return 'CLM' + (maxNum + 1);
  }

  /**
   * Opens the shared Claim Details modal used across Dashboard and My Claims.
   */
  function openClaimDetailsModal(claimId) {
    var claims = CC.getClaims();
    var claim = null;
    for (var i = 0; i < claims.length; i++) {
      if (claims[i].id === claimId) {
        claim = claims[i];
        break;
      }
    }
    if (!claim) return;

    var modal = document.getElementById('claimDetailsModal');
    var body = document.getElementById('claimDetailsBody');
    var trackLink = document.getElementById('modalTrackLink');
    if (!modal || !body) return;

    var docs = CC.getDocuments().filter(function (d) {
      return d.claimId === claim.id;
    });

    var docsHtml = docs.length
      ? '<ul class="activity-list">' + docs.map(function (d) {
          return '<li class="activity-item"><span><strong>' + CC.escapeHTML(d.name) + '</strong> (' +
            CC.escapeHTML(d.docType) + ')</span><span class="activity-meta tabular">' +
            CC.escapeHTML(d.fileSize) + ' · ' + CC.escapeHTML(d.uploadDate) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="form-hint">No documents attached yet.</p>';

    body.innerHTML =
      '<div class="detail-grid">' +
        '<div class="detail-item"><span class="detail-label">Claim ID</span><span class="detail-value tabular">' + CC.escapeHTML(claim.id) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Policy Number</span><span class="detail-value tabular">' + CC.escapeHTML(claim.policyNumber) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Current Status</span><span class="detail-value">' + CC.escapeHTML(claim.status) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Insurance Type</span><span class="detail-value">' + CC.escapeHTML(claim.insuranceType) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Claim Type</span><span class="detail-value">' + CC.escapeHTML(claim.claimType) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Claim Amount</span><span class="detail-value tabular">' + CC.formatCurrency(claim.claimAmount) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Submission Date</span><span class="detail-value tabular">' + CC.escapeHTML(claim.submissionDate) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Incident Date</span><span class="detail-value tabular">' + CC.escapeHTML(claim.incidentDate) + '</span></div>' +
        '<div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value tabular">' + CC.escapeHTML(claim.lastUpdated) + '</span></div>' +
      '</div>' +
      '<div class="notice notice--navy">' +
        '<span class="notice-title">Incident Location &amp; Description</span>' +
        '<p><strong>' + CC.escapeHTML(claim.incidentLocation) + '</strong> — ' + CC.escapeHTML(claim.description) + '</p>' +
      '</div>' +
      '<div class="notice notice--teal">' +
        '<span class="notice-title">Assessment Remarks</span>' +
        '<p>' + CC.escapeHTML(claim.remarks || 'No remarks recorded yet.') + '</p>' +
      '</div>' +
      '<div>' +
        '<h4 class="form-section-title">Attached Documents (' + docs.length + ')</h4>' +
        docsHtml +
      '</div>';

    if (trackLink) {
      trackLink.href = 'track-claim.html?claimId=' + encodeURIComponent(claim.id);
    }

    modal.classList.remove('hidden');
  }

  function initClaimModalClose() {
    var modal = document.getElementById('claimDetailsModal');
    var closeBtn = document.getElementById('closeClaimDetailsModal');
    var closeFooterBtn = document.getElementById('closeClaimDetailsFooter');
    if (!modal) return;

    function hide() {
      modal.classList.add('hidden');
    }
    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', hide);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) hide();
    });
  }

  /**
   * Initializes the Submit New Claim page (form validation, drafts, document upload, ID generation).
   */
  function initSubmitClaimPage() {
    var form = document.getElementById('submitClaimForm');
    if (!form) return;

    var user = window.ClaimCareAuth.requireAuth();
    if (!user) return;

    var draftKey = CC.STORAGE_KEYS.DRAFT + '_' + user.id;
    var noticeEl = document.getElementById('submitClaimNotice');
    var draftBanner = document.getElementById('draftNotice');
    var insuranceSelect = document.getElementById('insuranceType');
    var billsLabel = document.getElementById('billsDocLabel');

    function prefillUserFields() {
      document.getElementById('claimFullName').value = user.fullName || '';
      document.getElementById('claimEmail').value = user.email || '';
      document.getElementById('claimPhone').value = user.phone || '';
      document.getElementById('claimAddress').value = user.address || '';
    }

    function updateDynamicBillsLabel() {
      if (!insuranceSelect || !billsLabel) return;
      var val = insuranceSelect.value;
      if (val === 'Health Insurance') {
        billsLabel.textContent = 'Medical Bills & Discharge Summary';
      } else if (val === 'Vehicle Insurance' || val === 'Property Insurance') {
        billsLabel.textContent = 'Repair Bills / Estimate';
      } else if (val === 'Life Insurance') {
        billsLabel.textContent = 'Medical / Supporting Certificates';
      } else {
        billsLabel.textContent = 'Medical Bills / Repair Bills';
      }
    }

    prefillUserFields();

    // Check query param for pre-selected insurance type
    var typeParam = CC.getQueryParam('type');
    if (typeParam && insuranceSelect) {
      for (var i = 0; i < insuranceSelect.options.length; i++) {
        if (insuranceSelect.options[i].value.toLowerCase().indexOf(typeParam.toLowerCase()) !== -1) {
          insuranceSelect.selectedIndex = i;
          break;
        }
      }
    }
    updateDynamicBillsLabel();
    if (insuranceSelect) {
      insuranceSelect.addEventListener('change', updateDynamicBillsLabel);
    }

    // Check for saved draft
    var existingDraft = CC.readJSON(draftKey, null);
    if (existingDraft && draftBanner) {
      draftBanner.classList.remove('hidden');
      var loadDraftBtn = document.getElementById('loadDraftBtn');
      var discardDraftBtn = document.getElementById('discardDraftBtn');

      if (loadDraftBtn) {
        loadDraftBtn.addEventListener('click', function () {
          var fields = [
            'claimFullName', 'claimEmail', 'claimPhone', 'claimAddress',
            'policyNumber', 'insuranceType', 'policyStartDate', 'policyExpiryDate',
            'claimType', 'incidentDate', 'incidentLocation', 'claimAmount', 'incidentDescription'
          ];
          for (var j = 0; j < fields.length; j++) {
            var el = document.getElementById(fields[j]);
            if (el && existingDraft[fields[j]] !== undefined) {
              el.value = existingDraft[fields[j]];
            }
          }
          updateDynamicBillsLabel();
          CC.showNotice(noticeEl, 'Saved draft loaded into the form.', 'teal');
        });
      }

      if (discardDraftBtn) {
        discardDraftBtn.addEventListener('click', function () {
          localStorage.removeItem(draftKey);
          draftBanner.classList.add('hidden');
          CC.showNotice(noticeEl, 'Saved draft discarded.', 'navy');
        });
      }
    }

    // Save as Draft handler
    var saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', function () {
        var draftData = {
          claimFullName: document.getElementById('claimFullName').value.trim(),
          claimEmail: document.getElementById('claimEmail').value.trim(),
          claimPhone: document.getElementById('claimPhone').value.trim(),
          claimAddress: document.getElementById('claimAddress').value.trim(),
          policyNumber: document.getElementById('policyNumber').value.trim(),
          insuranceType: document.getElementById('insuranceType').value,
          policyStartDate: document.getElementById('policyStartDate').value,
          policyExpiryDate: document.getElementById('policyExpiryDate').value,
          claimType: document.getElementById('claimType').value.trim(),
          incidentDate: document.getElementById('incidentDate').value,
          incidentLocation: document.getElementById('incidentLocation').value.trim(),
          claimAmount: document.getElementById('claimAmount').value,
          incidentDescription: document.getElementById('incidentDescription').value.trim(),
          savedAt: CC.getTodayISO()
        };
        CC.writeJSON(draftKey, draftData);
        if (draftBanner) draftBanner.classList.remove('hidden');
        CC.showNotice(noticeEl, 'Claim draft saved locally in your browser. You can resume it anytime.', 'teal');
      });
    }

    // Reset handler
    var resetBtn = document.getElementById('resetClaimBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        prefillUserFields();
        updateDynamicBillsLabel();
        CC.hideNotice(noticeEl);
      });
    }

    // Submit Claim handler
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      CC.hideNotice(noticeEl);

      var fullName = document.getElementById('claimFullName').value.trim();
      var email = document.getElementById('claimEmail').value.trim();
      var phone = document.getElementById('claimPhone').value.trim();
      var address = document.getElementById('claimAddress').value.trim();
      var policyNumber = document.getElementById('policyNumber').value.trim().toUpperCase();
      var insuranceType = document.getElementById('insuranceType').value;
      var policyStart = document.getElementById('policyStartDate').value;
      var policyExpiry = document.getElementById('policyExpiryDate').value;
      var claimType = document.getElementById('claimType').value.trim();
      var incidentDate = document.getElementById('incidentDate').value;
      var incidentLocation = document.getElementById('incidentLocation').value.trim();
      var claimAmount = Number(document.getElementById('claimAmount').value);
      var description = document.getElementById('incidentDescription').value.trim();

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var today = CC.getTodayISO();

      if (!fullName || !emailRegex.test(email) || !phone || !address) {
        CC.showNotice(noticeEl, 'Please complete all required personal information fields with valid contact details.', 'navy');
        return;
      }

      if (!policyNumber || !insuranceType || !policyStart || !policyExpiry) {
        CC.showNotice(noticeEl, 'Please complete all required insurance policy fields.', 'navy');
        return;
      }

      if (policyExpiry < policyStart) {
        CC.showNotice(noticeEl, 'Policy Expiry Date cannot be earlier than Policy Start Date.', 'navy');
        return;
      }

      if (!claimType || !incidentDate || !incidentLocation || !description) {
        CC.showNotice(noticeEl, 'Please complete all required claim and incident description fields.', 'navy');
        return;
      }

      if (incidentDate > today) {
        CC.showNotice(noticeEl, 'Date of Incident cannot be in the future.', 'navy');
        return;
      }

      if (!claimAmount || claimAmount <= 0 || isNaN(claimAmount)) {
        CC.showNotice(noticeEl, 'Please enter a valid positive Claim Amount.', 'navy');
        return;
      }

      // Validate uploaded files
      var fileFields = [
        { id: 'docIdentity', label: 'Identity Proof', required: true },
        { id: 'docPolicy', label: 'Insurance Policy Document', required: true },
        { id: 'docEvidence', label: 'Supporting Evidence', required: false },
        { id: 'docBills', label: billsLabel ? billsLabel.textContent : 'Medical / Repair Bills', required: false }
      ];

      var validatedFiles = [];
      for (var k = 0; k < fileFields.length; k++) {
        var input = document.getElementById(fileFields[k].id);
        var res = validateFileInput(input, fileFields[k].required);
        if (!res.valid) {
          CC.showNotice(noticeEl, fileFields[k].label + ': ' + res.error, 'navy');
          return;
        }
        if (res.file) {
          validatedFiles.push({
            docType: fileFields[k].label,
            file: res.file
          });
        }
      }

      var claims = CC.getClaims();
      var newClaimId = generateClaimId(claims);
      var newClaim = {
        id: newClaimId,
        userId: user.id,
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
        policyNumber: policyNumber,
        insuranceType: insuranceType,
        policyStartDate: policyStart,
        policyExpiryDate: policyExpiry,
        claimType: claimType,
        incidentDate: incidentDate,
        incidentLocation: incidentLocation,
        claimAmount: claimAmount,
        description: description,
        submissionDate: today,
        lastUpdated: today,
        status: 'Submitted',
        stage: 1,
        remarks: 'Claim submitted online. Queued for initial policy verification.'
      };

      claims.unshift(newClaim);
      CC.saveClaims(claims);

      // Save document records
      var docs = CC.getDocuments();
      for (var m = 0; m < validatedFiles.length; m++) {
        docs.unshift({
          id: 'DOC' + (Date.now() + m),
          userId: user.id,
          claimId: newClaimId,
          name: validatedFiles[m].file.name,
          docType: validatedFiles[m].docType,
          fileSize: CC.formatFileSize(validatedFiles[m].file.size),
          uploadDate: today,
          notes: 'Uploaded during claim submission.'
        });
      }
      CC.saveDocuments(docs);

      localStorage.removeItem(draftKey);
      CC.addActivity(user.id, newClaimId, 'Submitted new ' + insuranceType + ' claim ' + newClaimId + ' for ' + CC.formatCurrency(claimAmount) + '.');

      CC.showNotice(
        noticeEl,
        'Claim ' + newClaimId + ' submitted successfully! Redirecting to Claim Tracking...',
        'teal'
      );

      window.setTimeout(function () {
        window.location.href = 'track-claim.html?claimId=' + encodeURIComponent(newClaimId);
      }, 950);
    });
  }

  /**
   * Initializes My Claims page with search, filters, sorting, and details modal.
   */
  function initMyClaimsPage() {
    var tableBody = document.getElementById('myClaimsTableBody');
    if (!tableBody) return;

    var user = window.ClaimCareAuth.requireAuth();
    if (!user) return;

    initClaimModalClose();

    var searchInput = document.getElementById('claimsSearchInput');
    var typeFilter = document.getElementById('claimsTypeFilter');
    var statusFilter = document.getElementById('claimsStatusFilter');
    var sortSelect = document.getElementById('claimsSortOrder');
    var countEl = document.getElementById('myClaimsCount');
    var emptyEl = document.getElementById('myClaimsEmpty');
    var tableWrap = document.getElementById('myClaimsTableWrap');

    function render() {
      var allClaims = CC.getClaims().filter(function (c) {
        return user.role === 'admin' ? true : c.userId === user.id;
      });

      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var selectedType = typeFilter ? typeFilter.value : 'all';
      var selectedStatus = statusFilter ? statusFilter.value : 'all';
      var sortOrder = sortSelect ? sortSelect.value : 'newest';

      var filtered = allClaims.filter(function (c) {
        var matchesQuery = !query ||
          c.id.toLowerCase().indexOf(query) !== -1 ||
          c.policyNumber.toLowerCase().indexOf(query) !== -1 ||
          c.claimType.toLowerCase().indexOf(query) !== -1;
        var matchesType = selectedType === 'all' || c.insuranceType === selectedType;
        var matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
        return matchesQuery && matchesType && matchesStatus;
      });

      filtered.sort(function (a, b) {
        if (sortOrder === 'oldest') {
          return a.submissionDate.localeCompare(b.submissionDate);
        }
        return b.submissionDate.localeCompare(a.submissionDate);
      });

      if (countEl) {
        countEl.textContent = filtered.length + (filtered.length === 1 ? ' claim' : ' claims');
      }

      if (filtered.length === 0) {
        if (tableWrap) tableWrap.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        tableBody.innerHTML = '';
        return;
      }

      if (tableWrap) tableWrap.classList.remove('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');

      tableBody.innerHTML = filtered.map(function (c) {
        var statusClass = (c.status === 'Approved' || c.status === 'Settled')
          ? 'status-text status-text--teal'
          : 'status-text';
        return '<tr>' +
          '<td class="tabular"><strong>' + CC.escapeHTML(c.id) + '</strong></td>' +
          '<td>' + CC.escapeHTML(c.insuranceType) + '</td>' +
          '<td class="cell-amount">' + CC.formatCurrency(c.claimAmount) + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(c.submissionDate) + '</td>' +
          '<td><span class="' + statusClass + '">' + CC.escapeHTML(c.status) + '</span></td>' +
          '<td>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-view-claim="' + CC.escapeHTML(c.id) + '">View Details</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      var viewBtns = tableBody.querySelectorAll('[data-view-claim]');
      for (var i = 0; i < viewBtns.length; i++) {
        viewBtns[i].addEventListener('click', function () {
          openClaimDetailsModal(this.getAttribute('data-view-claim'));
        });
      }
    }

    if (searchInput) searchInput.addEventListener('input', render);
    if (typeFilter) typeFilter.addEventListener('change', render);
    if (statusFilter) statusFilter.addEventListener('change', render);
    if (sortSelect) sortSelect.addEventListener('change', render);

    render();
  }

  /**
   * Initializes the Claim Tracking page (both public guest access and logged-in portal mode).
   */
  function initTrackClaimPage() {
    var trackForm = document.getElementById('trackClaimForm');
    if (!trackForm) return;

    var user = CC.getCurrentUser();
    var publicHeader = document.getElementById('trackPublicHeader');
    var portalSidebar = document.getElementById('portalSidebar');
    var portalTopbar = document.getElementById('trackPortalTopbar');
    var layoutWrapper = document.getElementById('trackLayoutWrapper');

    if (user) {
      if (publicHeader) publicHeader.classList.add('hidden');
      if (portalSidebar) portalSidebar.classList.remove('hidden');
      if (portalTopbar) portalTopbar.classList.remove('hidden');
      if (layoutWrapper) layoutWrapper.classList.add('portal-layout');
    } else {
      if (publicHeader) publicHeader.classList.remove('hidden');
      if (portalSidebar) portalSidebar.classList.add('hidden');
      if (portalTopbar) portalTopbar.classList.add('hidden');
      if (layoutWrapper) layoutWrapper.classList.remove('portal-layout');
    }

    var input = document.getElementById('trackClaimInput');
    var noticeEl = document.getElementById('trackNotice');
    var resultEl = document.getElementById('trackResultCard');

    function renderClaimTracking(claimIdRaw) {
      var cid = (claimIdRaw || '').trim().toUpperCase();
      CC.hideNotice(noticeEl);

      if (!cid) {
        if (resultEl) resultEl.classList.add('hidden');
        CC.showNotice(noticeEl, 'Please enter a valid Claim ID (for example, CLM1001).', 'navy');
        return;
      }

      var claims = CC.getClaims();
      var found = null;
      for (var i = 0; i < claims.length; i++) {
        if (claims[i].id.toUpperCase() === cid) {
          found = claims[i];
          break;
        }
      }

      if (!found) {
        if (resultEl) resultEl.classList.add('hidden');
        CC.showNotice(noticeEl, 'No claim found matching ID "' + cid + '". Try CLM1001, CLM1002, or CLM1003.', 'navy');
        return;
      }

      var currentStage = found.stage || CC.STATUS_STAGE_MAP[found.status] || 1;
      var explanation = CC.STATUS_EXPLANATIONS[found.status] || 'Your claim is actively being processed.';

      document.getElementById('trkClaimId').textContent = found.id;
      document.getElementById('trkPolicyNumber').textContent = found.policyNumber;
      document.getElementById('trkClaimType').textContent = found.insuranceType + ' — ' + found.claimType;
      document.getElementById('trkSubmissionDate').textContent = found.submissionDate;
      document.getElementById('trkClaimAmount').textContent = CC.formatCurrency(found.claimAmount);
      document.getElementById('trkCurrentStatus').textContent = found.status;
      document.getElementById('trkLastUpdated').textContent = found.lastUpdated;
      document.getElementById('trkExplanation').textContent = explanation;
      document.getElementById('trkRemarks').textContent = found.remarks || 'No additional remarks from the claims team.';

      var stepsList = document.getElementById('trackerStepsList');
      if (stepsList) {
        stepsList.innerHTML = CC.CLAIM_STAGES.map(function (label, idx) {
          var stepNum = idx + 1;
          var cls = 'tracker-step';
          var stateText = 'Pending';

          if (stepNum < currentStage) {
            cls += ' is-completed';
            stateText = 'Completed ✓';
          } else if (stepNum === currentStage) {
            if (found.status === 'Settled') {
              cls += ' is-completed';
              stateText = 'Completed ✓';
            } else {
              cls += ' is-current';
              stateText = found.status === 'Rejected' ? 'Closed (Rejected)' : 'Current Stage';
            }
          }

          var displayLabel = label;
          if (stepNum === 5) {
            if (found.status === 'Approved' || found.status === 'Settled') {
              displayLabel = 'Claim Approved';
            } else if (found.status === 'Rejected') {
              displayLabel = 'Claim Rejected';
            }
          }

          return '<li class="' + cls + '">' +
            '<span class="tracker-step-num tabular">' + stepNum + '</span>' +
            '<span class="tracker-step-label">' + CC.escapeHTML(displayLabel) + '</span>' +
            '<span class="tracker-step-state">' + CC.escapeHTML(stateText) + '</span>' +
          '</li>';
        }).join('');
      }

      if (resultEl) resultEl.classList.remove('hidden');
    }

    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      renderClaimTracking(input ? input.value : '');
    });

    var quickChips = document.querySelectorAll('[data-track-id]');
    for (var j = 0; j < quickChips.length; j++) {
      quickChips[j].addEventListener('click', function () {
        var cid = this.getAttribute('data-track-id');
        if (input) input.value = cid;
        renderClaimTracking(cid);
      });
    }

    var queryClaimId = CC.getQueryParam('claimId');
    if (queryClaimId) {
      if (input) input.value = queryClaimId;
      renderClaimTracking(queryClaimId);
    } else {
      if (input) input.value = 'CLM1001';
      renderClaimTracking('CLM1001');
    }
  }

  /**
   * Initializes the Document Management page (table, view/download, upload validation).
   */
  function initDocumentsPage() {
    var docsTableBody = document.getElementById('documentsTableBody');
    if (!docsTableBody) return;

    var user = window.ClaimCareAuth.requireAuth();
    if (!user) return;

    var claimSelect = document.getElementById('uploadDocClaimId');
    var uploadForm = document.getElementById('uploadDocumentForm');
    var noticeEl = document.getElementById('documentsNotice');
    var emptyEl = document.getElementById('documentsEmpty');
    var tableWrap = document.getElementById('documentsTableWrap');
    var docModal = document.getElementById('documentViewModal');
    var docModalBody = document.getElementById('documentViewBody');
    var closeDocModal = document.getElementById('closeDocumentViewModal');

    if (closeDocModal && docModal) {
      closeDocModal.addEventListener('click', function () {
        docModal.classList.add('hidden');
      });
      docModal.addEventListener('click', function (e) {
        if (e.target === docModal) docModal.classList.add('hidden');
      });
    }

    var userClaims = CC.getClaims().filter(function (c) {
      return user.role === 'admin' ? true : c.userId === user.id;
    });

    if (claimSelect) {
      if (userClaims.length === 0) {
        claimSelect.innerHTML = '<option value="">No claims available</option>';
      } else {
        claimSelect.innerHTML = userClaims.map(function (c) {
          return '<option value="' + CC.escapeHTML(c.id) + '">' +
            CC.escapeHTML(c.id + ' — ' + c.insuranceType + ' (' + c.status + ')') + '</option>';
        }).join('');
      }
    }

    function downloadDocumentReceipt(doc) {
      var content = [
        'ClaimCare — Document Verification Receipt (Frontend Demo)',
        '========================================================',
        'Document ID      : ' + doc.id,
        'Document Name    : ' + doc.name,
        'Associated Claim : ' + doc.claimId,
        'Document Type    : ' + doc.docType,
        'File Size        : ' + doc.fileSize,
        'Upload Date      : ' + doc.uploadDate,
        'Notes            : ' + (doc.notes || 'None'),
        '',
        'Notice: Document metadata is stored locally in browser LocalStorage for demo purposes.'
      ].join('\n');

      var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = doc.id + '_' + doc.name.replace(/[^a-zA-Z0-9._-]/g, '_') + '_record.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function renderDocs() {
      var docs = CC.getDocuments().filter(function (d) {
        return user.role === 'admin' ? true : d.userId === user.id;
      });

      if (docs.length === 0) {
        if (tableWrap) tableWrap.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        docsTableBody.innerHTML = '';
        return;
      }

      if (tableWrap) tableWrap.classList.remove('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');

      docsTableBody.innerHTML = docs.map(function (d) {
        return '<tr>' +
          '<td><strong>' + CC.escapeHTML(d.name) + '</strong></td>' +
          '<td class="tabular">' + CC.escapeHTML(d.claimId) + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(d.uploadDate) + '</td>' +
          '<td>' + CC.escapeHTML(d.docType) + '</td>' +
          '<td class="tabular">' + CC.escapeHTML(d.fileSize) + '</td>' +
          '<td>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-view-doc="' + CC.escapeHTML(d.id) + '">View</button> ' +
            '<button type="button" class="btn btn--outline-teal btn--sm" data-download-doc="' + CC.escapeHTML(d.id) + '">Download</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      var viewBtns = docsTableBody.querySelectorAll('[data-view-doc]');
      for (var i = 0; i < viewBtns.length; i++) {
        viewBtns[i].addEventListener('click', function () {
          var id = this.getAttribute('data-view-doc');
          var target = docs.find(function (item) { return item.id === id; });
          if (!target || !docModal || !docModalBody) return;
          docModalBody.innerHTML =
            '<div class="detail-grid">' +
              '<div class="detail-item"><span class="detail-label">Document ID</span><span class="detail-value tabular">' + CC.escapeHTML(target.id) + '</span></div>' +
              '<div class="detail-item"><span class="detail-label">Associated Claim</span><span class="detail-value tabular">' + CC.escapeHTML(target.claimId) + '</span></div>' +
              '<div class="detail-item"><span class="detail-label">Upload Date</span><span class="detail-value tabular">' + CC.escapeHTML(target.uploadDate) + '</span></div>' +
              '<div class="detail-item"><span class="detail-label">Document Name</span><span class="detail-value">' + CC.escapeHTML(target.name) + '</span></div>' +
              '<div class="detail-item"><span class="detail-label">Document Type</span><span class="detail-value">' + CC.escapeHTML(target.docType) + '</span></div>' +
              '<div class="detail-item"><span class="detail-label">Recorded Size</span><span class="detail-value tabular">' + CC.escapeHTML(target.fileSize) + '</span></div>' +
            '</div>' +
            '<div class="notice notice--navy">' +
              '<span class="notice-title">Local Demo Storage Note</span>' +
              '<p>In this frontend demo, file metadata is saved in LocalStorage. Real encrypted binary file preview requires a backend storage server.</p>' +
            '</div>';
          docModal.classList.remove('hidden');
        });
      }

      var dlBtns = docsTableBody.querySelectorAll('[data-download-doc]');
      for (var j = 0; j < dlBtns.length; j++) {
        dlBtns[j].addEventListener('click', function () {
          var id = this.getAttribute('data-download-doc');
          var target = docs.find(function (item) { return item.id === id; });
          if (target) downloadDocumentReceipt(target);
        });
      }
    }

    if (uploadForm) {
      uploadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        CC.hideNotice(noticeEl);

        var claimId = claimSelect ? claimSelect.value : '';
        var docType = document.getElementById('uploadDocType').value;
        var fileInput = document.getElementById('uploadDocFile');

        if (!claimId) {
          CC.showNotice(noticeEl, 'Please submit a claim first before uploading additional documents.', 'navy');
          return;
        }

        var res = validateFileInput(fileInput, true);
        if (!res.valid) {
          CC.showNotice(noticeEl, res.error, 'navy');
          return;
        }

        var docs = CC.getDocuments();
        docs.unshift({
          id: 'DOC' + Date.now(),
          userId: user.id,
          claimId: claimId,
          name: res.file.name,
          docType: docType,
          fileSize: CC.formatFileSize(res.file.size),
          uploadDate: CC.getTodayISO(),
          notes: 'Additional supporting document uploaded via Document Management.'
        });
        CC.saveDocuments(docs);
        CC.addActivity(user.id, claimId, 'Uploaded "' + res.file.name + '" (' + docType + ') for claim ' + claimId + '.');
        uploadForm.reset();
        CC.showNotice(noticeEl, 'Document "' + res.file.name + '" added to claim ' + claimId + '.', 'teal');
        renderDocs();
      });
    }

    renderDocs();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSubmitClaimPage();
    initMyClaimsPage();
    initTrackClaimPage();
    initDocumentsPage();
  });

  window.ClaimCareClaims = {
    openClaimDetailsModal: openClaimDetailsModal,
    initClaimModalClose: initClaimModalClose
  };
})(window);
