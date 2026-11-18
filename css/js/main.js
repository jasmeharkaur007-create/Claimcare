/**
 * ClaimCare — Core Shared Utilities & LocalStorage Data Store
 * Handles demo seed data initialization, formatting, navigation, and shared UI helpers.
 */
(function (window) {
  'use strict';

  var STORAGE_KEYS = {
    INITIALIZED: 'cc_initialized_v1',
    USERS: 'cc_users',
    SESSION: 'cc_session',
    CLAIMS: 'cc_claims',
    DOCUMENTS: 'cc_documents',
    ACTIVITIES: 'cc_activities',
    DRAFT: 'cc_claim_draft',
    INQUIRIES: 'cc_contact_inquiries'
  };

  var CLAIM_STAGES = [
    'Claim Submitted',
    'Initial Verification',
    'Document Verification',
    'Claim Assessment',
    'Claim Approved / Rejected',
    'Settlement Completed'
  ];

  var STATUS_EXPLANATIONS = {
    'Submitted': 'Your claim has been logged in our system and is queued for initial policy verification.',
    'Under Review': 'Our claims assessment team is reviewing your policy coverage, incident details, and submitted records.',
    'Documents Required': 'Additional supporting documentation is needed before assessment can proceed. Please review the remarks below.',
    'Approved': 'Your claim has been approved after verification. Settlement disbursement is being prepared.',
    'Rejected': 'Your claim could not be approved under the current policy terms. Review the assessment remarks for details.',
    'Settled': 'Claim settlement has been completed and disbursement instructions have been issued.'
  };

  var STATUS_STAGE_MAP = {
    'Submitted': 1,
    'Under Review': 3,
    'Documents Required': 3,
    'Approved': 5,
    'Rejected': 5,
    'Settled': 6
  };

  /**
   * Seeds realistic demo users, claims, documents, and activities on first load.
   */
  function initializeStore() {
    if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true') {
      return;
    }

    var defaultUsers = [
      {
        id: 'USR1001',
        fullName: 'Aarav Sharma',
        email: 'customer@claimcare.demo',
        phone: '+91 98765 43210',
        address: '42 Indiranagar 100 Feet Road, Bengaluru 560038',
        password: 'Password123',
        role: 'customer',
        createdAt: '2026-01-15'
      },
      {
        id: 'USR1002',
        fullName: 'Priya Nair',
        email: 'priya.nair@example.com',
        phone: '+91 98111 22334',
        address: '18 Marine Drive, Kochi 682031',
        password: 'Password123',
        role: 'customer',
        createdAt: '2026-02-02'
      },
      {
        id: 'ADM0001',
        fullName: 'Vikram Mehta',
        email: 'admin@claimcare.demo',
        phone: '+91 98000 11223',
        address: 'ClaimCare Operations Center, Mumbai 400001',
        password: 'Admin123',
        role: 'admin',
        createdAt: '2025-11-01'
      }
    ];

    var defaultClaims = [
      {
        id: 'CLM1001',
        userId: 'USR1001',
        fullName: 'Aarav Sharma',
        email: 'customer@claimcare.demo',
        phone: '+91 98765 43210',
        address: '42 Indiranagar 100 Feet Road, Bengaluru 560038',
        policyNumber: 'POL-VEH-88412',
        insuranceType: 'Vehicle Insurance',
        policyStartDate: '2026-01-01',
        policyExpiryDate: '2027-01-01',
        claimType: 'Collision Repair',
        incidentDate: '2026-10-26',
        incidentLocation: 'Outer Ring Road, Bengaluru',
        claimAmount: 45000,
        description: 'Front bumper and left headlamp assembly damaged during low-speed traffic collision near Marathahalli junction.',
        submissionDate: '2026-10-28',
        lastUpdated: '2026-11-05',
        status: 'Under Review',
        stage: 3,
        remarks: 'Authorized workshop repair estimate received. Assessor verification in progress.'
      },
      {
        id: 'CLM1002',
        userId: 'USR1001',
        fullName: 'Aarav Sharma',
        email: 'customer@claimcare.demo',
        phone: '+91 98765 43210',
        address: '42 Indiranagar 100 Feet Road, Bengaluru 560038',
        policyNumber: 'POL-HLT-55209',
        insuranceType: 'Health Insurance',
        policyStartDate: '2025-12-01',
        policyExpiryDate: '2026-11-30',
        claimType: 'Inpatient Hospitalization',
        incidentDate: '2026-10-08',
        incidentLocation: 'Manipal Hospital, Bengaluru',
        claimAmount: 25000,
        description: 'Two-day inpatient admission for acute appendicitis surgery and diagnostic pathology.',
        submissionDate: '2026-10-12',
        lastUpdated: '2026-10-24',
        status: 'Approved',
        stage: 5,
        remarks: 'Discharge summary and itemized hospital bills verified. Approved for direct reimbursement.'
      },
      {
        id: 'CLM1003',
        userId: 'USR1001',
        fullName: 'Aarav Sharma',
        email: 'customer@claimcare.demo',
        phone: '+91 98765 43210',
        address: '42 Indiranagar 100 Feet Road, Bengaluru 560038',
        policyNumber: 'POL-PRP-31904',
        insuranceType: 'Property Insurance',
        policyStartDate: '2026-03-15',
        policyExpiryDate: '2027-03-14',
        claimType: 'Storm Water Damage',
        incidentDate: '2026-10-30',
        incidentLocation: 'Indiranagar, Bengaluru',
        claimAmount: 120000,
        description: 'Roof waterproofing failure and electrical distribution panel damage following heavy rainfall.',
        submissionDate: '2026-11-01',
        lastUpdated: '2026-11-08',
        status: 'Documents Required',
        stage: 3,
        remarks: 'Please upload certified contractor repair quotation and stamped photographs of affected rooms.'
      },
      {
        id: 'CLM1004',
        userId: 'USR1001',
        fullName: 'Aarav Sharma',
        email: 'customer@claimcare.demo',
        phone: '+91 98765 43210',
        address: '42 Indiranagar 100 Feet Road, Bengaluru 560038',
        policyNumber: 'POL-LIF-77301',
        insuranceType: 'Life Insurance',
        policyStartDate: '2024-06-01',
        policyExpiryDate: '2034-05-31',
        claimType: 'Critical Illness Rider',
        incidentDate: '2026-09-10',
        incidentLocation: 'Bengaluru',
        claimAmount: 85000,
        description: 'Critical illness benefit claim filed with specialist physician diagnosis record.',
        submissionDate: '2026-09-18',
        lastUpdated: '2026-10-02',
        status: 'Settled',
        stage: 6,
        remarks: 'NEFT settlement completed to registered bank account.'
      },
      {
        id: 'CLM1005',
        userId: 'USR1002',
        fullName: 'Priya Nair',
        email: 'priya.nair@example.com',
        phone: '+91 98111 22334',
        address: '18 Marine Drive, Kochi 682031',
        policyNumber: 'POL-VEH-60418',
        insuranceType: 'Vehicle Insurance',
        policyStartDate: '2026-02-10',
        policyExpiryDate: '2027-02-09',
        claimType: 'Windshield Replacement',
        incidentDate: '2026-11-03',
        incidentLocation: 'NH 66, Kochi',
        claimAmount: 18500,
        description: 'Front laminated windshield cracked by loose highway gravel impact.',
        submissionDate: '2026-11-04',
        lastUpdated: '2026-11-06',
        status: 'Submitted',
        stage: 1,
        remarks: 'Claim received and queued for initial policy validation.'
      },
      {
        id: 'CLM1006',
        userId: 'USR1002',
        fullName: 'Priya Nair',
        email: 'priya.nair@example.com',
        phone: '+91 98111 22334',
        address: '18 Marine Drive, Kochi 682031',
        policyNumber: 'POL-HLT-91204',
        insuranceType: 'Health Insurance',
        policyStartDate: '2026-01-20',
        policyExpiryDate: '2027-01-19',
        claimType: 'Outpatient Dental Procedure',
        incidentDate: '2026-10-01',
        incidentLocation: 'Lakeshore Hospital, Kochi',
        claimAmount: 32000,
        description: 'Elective cosmetic dental restoration procedure.',
        submissionDate: '2026-10-05',
        lastUpdated: '2026-10-14',
        status: 'Rejected',
        stage: 5,
        remarks: 'Policy exclusion clause 4.2 applies: elective cosmetic dental treatments are not covered.'
      }
    ];

    var defaultDocuments = [
      {
        id: 'DOC2001',
        userId: 'USR1001',
        claimId: 'CLM1001',
        name: 'Aarav_Driving_License.pdf',
        docType: 'Identity Proof',
        fileSize: '420 KB',
        uploadDate: '2026-10-28',
        notes: 'Verified government-issued driving license.'
      },
      {
        id: 'DOC2002',
        userId: 'USR1001',
        claimId: 'CLM1001',
        name: 'Motor_Policy_88412.pdf',
        docType: 'Insurance Policy Document',
        fileSize: '615 KB',
        uploadDate: '2026-10-28',
        notes: 'Comprehensive vehicle policy schedule.'
      },
      {
        id: 'DOC2003',
        userId: 'USR1001',
        claimId: 'CLM1001',
        name: 'Garage_Repair_Estimate.pdf',
        docType: 'Repair Bills',
        fileSize: '510 KB',
        uploadDate: '2026-10-29',
        notes: 'Authorized service center itemized estimate.'
      },
      {
        id: 'DOC2004',
        userId: 'USR1001',
        claimId: 'CLM1002',
        name: 'Manipal_Hospital_Final_Bill.pdf',
        docType: 'Medical Bills',
        fileSize: '840 KB',
        uploadDate: '2026-10-12',
        notes: 'Itemized inpatient surgical invoice and discharge summary.'
      },
      {
        id: 'DOC2005',
        userId: 'USR1001',
        claimId: 'CLM1003',
        name: 'Property_Schedule_31904.pdf',
        docType: 'Insurance Policy Document',
        fileSize: '490 KB',
        uploadDate: '2026-11-01',
        notes: 'Residential property policy certificate.'
      },
      {
        id: 'DOC2006',
        userId: 'USR1002',
        claimId: 'CLM1005',
        name: 'Windshield_Photo_Evidence.jpg',
        docType: 'Supporting Evidence',
        fileSize: '1.2 MB',
        uploadDate: '2026-11-04',
        notes: 'Front vehicle photograph showing windshield crack.'
      }
    ];

    var defaultActivities = [
      {
        id: 'ACT3001',
        userId: 'USR1001',
        claimId: 'CLM1003',
        action: 'Document request issued for Property Insurance claim CLM1003.',
        timestamp: '2026-11-08 11:20'
      },
      {
        id: 'ACT3002',
        userId: 'USR1001',
        claimId: 'CLM1001',
        action: 'Vehicle Insurance claim CLM1001 moved to Under Review.',
        timestamp: '2026-11-05 15:40'
      },
      {
        id: 'ACT3003',
        userId: 'USR1001',
        claimId: 'CLM1002',
        action: 'Health Insurance claim CLM1002 approved for ₹25,000.',
        timestamp: '2026-10-24 10:15'
      },
      {
        id: 'ACT3004',
        userId: 'USR1001',
        claimId: 'CLM1004',
        action: 'Life Insurance claim CLM1004 settlement completed.',
        timestamp: '2026-10-02 16:05'
      }
    ];

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(defaultClaims));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(defaultDocuments));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(defaultActivities));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUsers() {
    initializeStore();
    return readJSON(STORAGE_KEYS.USERS, []);
  }

  function saveUsers(users) {
    writeJSON(STORAGE_KEYS.USERS, users);
  }

  function getClaims() {
    initializeStore();
    return readJSON(STORAGE_KEYS.CLAIMS, []);
  }

  function saveClaims(claims) {
    writeJSON(STORAGE_KEYS.CLAIMS, claims);
  }

  function getDocuments() {
    initializeStore();
    return readJSON(STORAGE_KEYS.DOCUMENTS, []);
  }

  function saveDocuments(docs) {
    writeJSON(STORAGE_KEYS.DOCUMENTS, docs);
  }

  function getActivities() {
    initializeStore();
    return readJSON(STORAGE_KEYS.ACTIVITIES, []);
  }

  function addActivity(userId, claimId, action) {
    var list = getActivities();
    var now = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
      ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    list.unshift({
      id: 'ACT' + Date.now(),
      userId: userId || '',
      claimId: claimId || '',
      action: action,
      timestamp: stamp
    });
    writeJSON(STORAGE_KEYS.ACTIVITIES, list.slice(0, 40));
  }

  function getSession() {
    initializeStore();
    return readJSON(STORAGE_KEYS.SESSION, null);
  }

  function setSession(sessionObj) {
    writeJSON(STORAGE_KEYS.SESSION, sessionObj);
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  function getCurrentUser() {
    var session = getSession();
    if (!session || !session.userId) return null;
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === session.userId) {
        return users[i];
      }
    }
    return null;
  }

  function getTodayISO() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function formatCurrency(amount) {
    var num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN');
  }

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showNotice(el, message, tone) {
    if (!el) return;
    el.className = 'notice ' + (tone === 'navy' ? 'notice--navy' : 'notice--teal');
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideNotice(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.textContent = '';
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Initializes public header hamburger toggle and updates auth CTA if logged in.
   */
  function initPublicHeader() {
    var toggle = document.getElementById('navToggle');
    var drawer = document.getElementById('mobileDrawer');
    if (toggle && drawer) {
      toggle.addEventListener('click', function () {
        var open = drawer.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      var drawerLinks = drawer.querySelectorAll('a');
      for (var i = 0; i < drawerLinks.length; i++) {
        drawerLinks[i].addEventListener('click', function () {
          drawer.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    }

    var user = getCurrentUser();
    var navActions = document.getElementById('publicNavActions');
    var mobileActions = document.getElementById('mobileNavActions');
    if (user && navActions) {
      var targetHref = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      var targetLabel = user.role === 'admin' ? 'Admin Console' : 'My Dashboard';
      navActions.innerHTML =
        '<a href="' + targetHref + '" class="btn btn--primary btn--sm">' + escapeHTML(targetLabel) + '</a>' +
        '<button type="button" class="btn btn--secondary btn--sm" data-action="logout">Logout</button>';
      if (mobileActions) {
        mobileActions.innerHTML =
          '<a href="' + targetHref + '" class="btn btn--primary btn--sm">' + escapeHTML(targetLabel) + '</a>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-action="logout">Logout</button>';
      }
    }

    var logoutBtns = document.querySelectorAll('[data-action="logout"]');
    for (var j = 0; j < logoutBtns.length; j++) {
      logoutBtns[j].addEventListener('click', function () {
        clearSession();
        window.location.href = 'index.html';
      });
    }
  }

  /**
   * Initializes the collapsible portal sidebar and populates user metadata.
   */
  function initPortalShell() {
    var sidebar = document.getElementById('portalSidebar');
    var backdrop = document.getElementById('sidebarBackdrop');
    var openBtn = document.getElementById('sidebarOpenBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
    }

    if (openBtn && sidebar) {
      openBtn.addEventListener('click', function () {
        sidebar.classList.add('is-open');
        if (backdrop) backdrop.classList.add('is-open');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeSidebar);
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeSidebar);
    }

    var user = getCurrentUser();
    if (user) {
      var nameEls = document.querySelectorAll('[data-user-name]');
      for (var i = 0; i < nameEls.length; i++) {
        nameEls[i].textContent = user.fullName;
      }
      var roleEls = document.querySelectorAll('[data-user-role]');
      for (var j = 0; j < roleEls.length; j++) {
        roleEls[j].textContent = user.role === 'admin' ? 'Administrator' : 'Policyholder';
      }
    }

    var logoutTriggers = document.querySelectorAll('[data-action="logout"]');
    for (var k = 0; k < logoutTriggers.length; k++) {
      logoutTriggers[k].addEventListener('click', function () {
        clearSession();
        window.location.href = 'login.html';
      });
    }
  }

  /**
   * Initializes landing-page quick track widget and contact form.
   */
  function initLandingInteractions() {
    var quickTrackForm = document.getElementById('quickTrackForm');
    if (quickTrackForm) {
      quickTrackForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('quickTrackInput');
        var val = input ? input.value.trim().toUpperCase() : '';
        if (!val) {
          window.location.href = 'track-claim.html';
          return;
        }
        window.location.href = 'track-claim.html?claimId=' + encodeURIComponent(val);
      });
    }

    var sampleButtons = document.querySelectorAll('[data-sample-claim]');
    for (var i = 0; i < sampleButtons.length; i++) {
      sampleButtons[i].addEventListener('click', function () {
        var cid = this.getAttribute('data-sample-claim');
        var input = document.getElementById('quickTrackInput');
        if (input) {
          input.value = cid;
        }
        window.location.href = 'track-claim.html?claimId=' + encodeURIComponent(cid);
      });
    }

    var submitClaimCta = document.getElementById('heroSubmitClaimBtn');
    if (submitClaimCta) {
      submitClaimCta.addEventListener('click', function (e) {
        var user = getCurrentUser();
        if (!user) {
          e.preventDefault();
          window.location.href = 'login.html?redirect=submit-claim.html';
        }
      });
    }

    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('contactName');
        var emailInput = document.getElementById('contactEmail');
        var msgInput = document.getElementById('contactMessage');
        var noticeEl = document.getElementById('contactNotice');

        var nameVal = nameInput ? nameInput.value.trim() : '';
        var emailVal = emailInput ? emailInput.value.trim() : '';
        var msgVal = msgInput ? msgInput.value.trim() : '';
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!nameVal || !emailRegex.test(emailVal) || msgVal.length < 10) {
          showNotice(noticeEl, 'Please enter your name, a valid email address, and a message of at least 10 characters.', 'navy');
          return;
        }

        var inquiries = readJSON(STORAGE_KEYS.INQUIRIES, []);
        inquiries.unshift({
          id: 'INQ' + Date.now(),
          name: nameVal,
          email: emailVal,
          message: msgVal,
          date: getTodayISO()
        });
        writeJSON(STORAGE_KEYS.INQUIRIES, inquiries);
        contactForm.reset();
        showNotice(noticeEl, 'Thank you, ' + nameVal + '. Your support inquiry has been logged for our claims desk.', 'teal');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initializeStore();
    initPublicHeader();
    initPortalShell();
    initLandingInteractions();
  });

  window.ClaimCare = {
    STORAGE_KEYS: STORAGE_KEYS,
    CLAIM_STAGES: CLAIM_STAGES,
    STATUS_EXPLANATIONS: STATUS_EXPLANATIONS,
    STATUS_STAGE_MAP: STATUS_STAGE_MAP,
    initializeStore: initializeStore,
    readJSON: readJSON,
    writeJSON: writeJSON,
    getUsers: getUsers,
    saveUsers: saveUsers,
    getClaims: getClaims,
    saveClaims: saveClaims,
    getDocuments: getDocuments,
    saveDocuments: saveDocuments,
    getActivities: getActivities,
    addActivity: addActivity,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    getCurrentUser: getCurrentUser,
    getTodayISO: getTodayISO,
    formatCurrency: formatCurrency,
    formatFileSize: formatFileSize,
    escapeHTML: escapeHTML,
    showNotice: showNotice,
    hideNotice: hideNotice,
    getQueryParam: getQueryParam
  };
})(window);
