/**
 * MedTransport – Open-Source NEMT Scheduling
 * All data is stored in localStorage only. Nothing is transmitted externally.
 */
'use strict';

/* ============================================================
   DATA LAYER – localStorage persistence
   ============================================================ */
const DB = {
  PATIENTS_KEY: 'mt_patients',
  TRIPS_KEY:    'mt_trips',

  load(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getPatients() { return this.load(this.PATIENTS_KEY); },
  savePatients(patients) { this.save(this.PATIENTS_KEY, patients); },

  getTrips() { return this.load(this.TRIPS_KEY); },
  saveTrips(trips) { this.save(this.TRIPS_KEY, trips); },

  clearAll() {
    localStorage.removeItem(this.PATIENTS_KEY);
    localStorage.removeItem(this.TRIPS_KEY);
  }
};

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getStatusBadge(status) {
  const map = {
    'scheduled':   'badge-scheduled',
    'in-progress': 'badge-in-progress',
    'completed':   'badge-completed',
    'cancelled':   'badge-cancelled'
  };
  const cls = map[status] || 'badge-scheduled';
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const views = ['dashboard', 'patients', 'trips', 'import'];
const pageTitles = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  trips: 'Trips',
  import: 'Import / Export'
};

function navigateTo(viewName) {
  if (!views.includes(viewName)) return;

  // Update views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  // Update nav items
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Update page title
  document.getElementById('pageTitle').textContent = pageTitles[viewName] || viewName;

  // Refresh the view content
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'patients') renderPatients();
  if (viewName === 'trips') renderTrips();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const patients = DB.getPatients();
  const trips    = DB.getTrips();
  const today    = todayStr();

  document.getElementById('stat-patients').textContent   = patients.length;
  document.getElementById('stat-total-trips').textContent = trips.length;
  document.getElementById('stat-pending').textContent    = trips.filter(t => t.status === 'scheduled').length;
  document.getElementById('stat-today').textContent      = trips.filter(t => t.scheduledDate === today).length;

  // Upcoming trips: scheduled, sorted by date/time
  const upcoming = trips
    .filter(t => t.status === 'scheduled' && t.scheduledDate >= today)
    .sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`))
    .slice(0, 10);

  const tbody = document.getElementById('dashboardTripBody');
  if (upcoming.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No upcoming trips</td></tr>';
    return;
  }

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));

  tbody.innerHTML = upcoming.map(trip => {
    const p = patientMap[trip.patientId];
    const name = p ? escapeHtml(`${p.firstName} ${p.lastName}`) : '—';
    return `<tr>
      <td>${name}</td>
      <td>${formatDate(trip.scheduledDate)}</td>
      <td>${escapeHtml(trip.scheduledTime || '—')}</td>
      <td>${escapeHtml(trip.dropoffAddress || '—')}</td>
      <td>${getStatusBadge(trip.status)}</td>
    </tr>`;
  }).join('');
}

/* ============================================================
   PATIENTS
   ============================================================ */
let patientFilter = '';

function renderPatients(filter) {
  if (filter !== undefined) patientFilter = filter.toLowerCase();

  const patients = DB.getPatients().filter(p =>
    !patientFilter ||
    `${p.firstName} ${p.lastName} ${p.phone} ${p.insurance} ${p.medicalId}`
      .toLowerCase().includes(patientFilter)
  );

  const tbody = document.getElementById('patientTableBody');

  if (patients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No patients found.</td></tr>';
    return;
  }

  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</strong></td>
      <td>${formatDate(p.dob)}</td>
      <td>${escapeHtml(p.phone || '—')}</td>
      <td>${escapeHtml(p.insurance || '—')}</td>
      <td>${escapeHtml(p.mobilityNeeds || '—')}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="editPatient('${p.id}')" aria-label="Edit ${escapeHtml(p.firstName)}">✏️ Edit</button>
          <button class="btn-icon danger" onclick="deletePatient('${p.id}')" aria-label="Delete ${escapeHtml(p.firstName)}">🗑 Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function buildPatientForm(patient) {
  const v = patient || {};
  return `
    <div class="form-row">
      <div class="form-group">
        <label for="f-firstName">First Name *</label>
        <input id="f-firstName" type="text" value="${escapeHtml(v.firstName || '')}" required autocomplete="given-name" />
      </div>
      <div class="form-group">
        <label for="f-lastName">Last Name *</label>
        <input id="f-lastName" type="text" value="${escapeHtml(v.lastName || '')}" required autocomplete="family-name" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="f-dob">Date of Birth</label>
        <input id="f-dob" type="date" value="${escapeHtml(v.dob || '')}" />
      </div>
      <div class="form-group">
        <label for="f-phone">Phone</label>
        <input id="f-phone" type="tel" value="${escapeHtml(v.phone || '')}" autocomplete="tel" />
      </div>
    </div>
    <div class="form-group">
      <label for="f-address">Home Address</label>
      <input id="f-address" type="text" value="${escapeHtml(v.address || '')}" autocomplete="street-address" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="f-insurance">Insurance</label>
        <input id="f-insurance" type="text" value="${escapeHtml(v.insurance || '')}" placeholder="e.g. Medicaid" />
      </div>
      <div class="form-group">
        <label for="f-medicalId">Medical ID</label>
        <input id="f-medicalId" type="text" value="${escapeHtml(v.medicalId || '')}" />
      </div>
    </div>
    <div class="form-group">
      <label for="f-mobilityNeeds">Mobility Needs</label>
      <select id="f-mobilityNeeds">
        <option value="">— Select —</option>
        ${['Ambulatory','Wheelchair','Stretcher','Other'].map(opt =>
          `<option ${v.mobilityNeeds === opt ? 'selected' : ''}>${opt}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="f-notes">Notes</label>
      <textarea id="f-notes" rows="3">${escapeHtml(v.notes || '')}</textarea>
    </div>
  `;
}

function readPatientForm() {
  return {
    firstName:    document.getElementById('f-firstName').value.trim(),
    lastName:     document.getElementById('f-lastName').value.trim(),
    dob:          document.getElementById('f-dob').value,
    phone:        document.getElementById('f-phone').value.trim(),
    address:      document.getElementById('f-address').value.trim(),
    insurance:    document.getElementById('f-insurance').value.trim(),
    medicalId:    document.getElementById('f-medicalId').value.trim(),
    mobilityNeeds:document.getElementById('f-mobilityNeeds').value,
    notes:        document.getElementById('f-notes').value.trim()
  };
}

function openAddPatient() {
  openModal('Add Patient', buildPatientForm(null), () => {
    const data = readPatientForm();
    if (!data.firstName || !data.lastName) { showToast('First and last name are required.', 'error'); return false; }
    const patients = DB.getPatients();
    patients.unshift({ id: generateId(), ...data });
    DB.savePatients(patients);
    renderPatients();
    showToast('Patient added successfully.', 'success');
    return true;
  });
}

function editPatient(id) {
  const patients = DB.getPatients();
  const patient = patients.find(p => p.id === id);
  if (!patient) return;

  openModal('Edit Patient', buildPatientForm(patient), () => {
    const data = readPatientForm();
    if (!data.firstName || !data.lastName) { showToast('First and last name are required.', 'error'); return false; }
    const idx = patients.findIndex(p => p.id === id);
    patients[idx] = { ...patients[idx], ...data };
    DB.savePatients(patients);
    renderPatients();
    showToast('Patient updated.', 'success');
    return true;
  });
}

function deletePatient(id) {
  if (!confirm('Delete this patient? This will not delete associated trips.')) return;
  const patients = DB.getPatients().filter(p => p.id !== id);
  DB.savePatients(patients);
  renderPatients();
  renderDashboard();
  showToast('Patient deleted.');
}

/* ============================================================
   TRIPS
   ============================================================ */
let tripFilter = '';
let tripStatusFilter = 'all';

function renderTrips(filter) {
  if (filter !== undefined) tripFilter = filter.toLowerCase();

  const patients = DB.getPatients();
  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));

  let trips = DB.getTrips();

  if (tripStatusFilter !== 'all') {
    trips = trips.filter(t => t.status === tripStatusFilter);
  }

  if (tripFilter) {
    trips = trips.filter(t => {
      const p = patientMap[t.patientId];
      const name = p ? `${p.firstName} ${p.lastName}`.toLowerCase() : '';
      return name.includes(tripFilter) ||
        (t.pickupAddress || '').toLowerCase().includes(tripFilter) ||
        (t.dropoffAddress || '').toLowerCase().includes(tripFilter);
    });
  }

  trips.sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`));

  const tbody = document.getElementById('tripTableBody');
  if (trips.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No trips found.</td></tr>';
    return;
  }

  tbody.innerHTML = trips.map(trip => {
    const p = patientMap[trip.patientId];
    const name = p ? escapeHtml(`${p.firstName} ${p.lastName}`) : '—';
    return `<tr>
      <td><strong>${name}</strong></td>
      <td>${formatDate(trip.scheduledDate)}</td>
      <td>${escapeHtml(trip.scheduledTime || '—')}</td>
      <td class="truncate">${escapeHtml(trip.pickupAddress || '—')}</td>
      <td class="truncate">${escapeHtml(trip.dropoffAddress || '—')}</td>
      <td>${escapeHtml(trip.tripType || '—')}</td>
      <td>${getStatusBadge(trip.status)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="editTrip('${trip.id}')" aria-label="Edit trip">✏️ Edit</button>
          <button class="btn-icon danger" onclick="deleteTrip('${trip.id}')" aria-label="Delete trip">🗑 Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function buildTripForm(trip) {
  const v = trip || {};
  const patients = DB.getPatients();
  const patientOptions = patients.map(p =>
    `<option value="${p.id}" ${v.patientId === p.id ? 'selected' : ''}>${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</option>`
  ).join('');

  return `
    <div class="form-group">
      <label for="f-patientId">Patient *</label>
      <select id="f-patientId" required>
        <option value="">— Select patient —</option>
        ${patientOptions}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="f-scheduledDate">Date *</label>
        <input id="f-scheduledDate" type="date" value="${escapeHtml(v.scheduledDate || todayStr())}" required />
      </div>
      <div class="form-group">
        <label for="f-scheduledTime">Time *</label>
        <input id="f-scheduledTime" type="time" value="${escapeHtml(v.scheduledTime || '09:00')}" required />
      </div>
    </div>
    <div class="form-group">
      <label for="f-pickupAddress">Pickup Address *</label>
      <input id="f-pickupAddress" type="text" value="${escapeHtml(v.pickupAddress || '')}" required />
    </div>
    <div class="form-group">
      <label for="f-dropoffAddress">Dropoff Address *</label>
      <input id="f-dropoffAddress" type="text" value="${escapeHtml(v.dropoffAddress || '')}" required />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="f-tripType">Trip Type</label>
        <select id="f-tripType">
          ${['Medical Appointment','Dialysis','Chemotherapy','Physical Therapy','Pharmacy','Discharge','Other'].map(opt =>
            `<option ${v.tripType === opt ? 'selected' : ''}>${opt}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="f-status">Status</label>
        <select id="f-status">
          ${['scheduled','in-progress','completed','cancelled'].map(opt =>
            `<option value="${opt}" ${v.status === opt ? 'selected' : ''}>${opt}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="f-driverNotes">Driver Notes</label>
      <textarea id="f-driverNotes" rows="3">${escapeHtml(v.driverNotes || '')}</textarea>
    </div>
  `;
}

function readTripForm() {
  return {
    patientId:       document.getElementById('f-patientId').value,
    scheduledDate:   document.getElementById('f-scheduledDate').value,
    scheduledTime:   document.getElementById('f-scheduledTime').value,
    pickupAddress:   document.getElementById('f-pickupAddress').value.trim(),
    dropoffAddress:  document.getElementById('f-dropoffAddress').value.trim(),
    tripType:        document.getElementById('f-tripType').value,
    status:          document.getElementById('f-status').value,
    driverNotes:     document.getElementById('f-driverNotes').value.trim()
  };
}

function openAddTrip() {
  const patients = DB.getPatients();
  if (patients.length === 0) {
    showToast('Please add at least one patient before scheduling a trip.', 'error');
    return;
  }
  openModal('Schedule Trip', buildTripForm(null), () => {
    const data = readTripForm();
    if (!data.patientId)      { showToast('Please select a patient.', 'error'); return false; }
    if (!data.scheduledDate)  { showToast('Please set a date.', 'error'); return false; }
    if (!data.pickupAddress)  { showToast('Pickup address is required.', 'error'); return false; }
    if (!data.dropoffAddress) { showToast('Dropoff address is required.', 'error'); return false; }
    const trips = DB.getTrips();
    trips.unshift({ id: generateId(), ...data });
    DB.saveTrips(trips);
    renderTrips();
    renderDashboard();
    showToast('Trip scheduled.', 'success');
    return true;
  });
}

function editTrip(id) {
  const trips = DB.getTrips();
  const trip = trips.find(t => t.id === id);
  if (!trip) return;

  openModal('Edit Trip', buildTripForm(trip), () => {
    const data = readTripForm();
    if (!data.patientId)      { showToast('Please select a patient.', 'error'); return false; }
    if (!data.scheduledDate)  { showToast('Please set a date.', 'error'); return false; }
    if (!data.pickupAddress)  { showToast('Pickup address is required.', 'error'); return false; }
    if (!data.dropoffAddress) { showToast('Dropoff address is required.', 'error'); return false; }
    const idx = trips.findIndex(t => t.id === id);
    trips[idx] = { ...trips[idx], ...data };
    DB.saveTrips(trips);
    renderTrips();
    renderDashboard();
    showToast('Trip updated.', 'success');
    return true;
  });
}

function deleteTrip(id) {
  if (!confirm('Delete this trip?')) return;
  const trips = DB.getTrips().filter(t => t.id !== id);
  DB.saveTrips(trips);
  renderTrips();
  renderDashboard();
  showToast('Trip deleted.');
}

/* ============================================================
   MODAL
   ============================================================ */
let _onModalSave = null;

function openModal(title, bodyHtml, onSave) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.remove('hidden');
  _onModalSave = onSave;

  // Focus first focusable element
  const first = document.querySelector('#modalBody input, #modalBody select, #modalBody textarea');
  if (first) setTimeout(() => first.focus(), 50);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalBody').innerHTML = '';
  _onModalSave = null;
}

/* ============================================================
   CSV IMPORT
   ============================================================ */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = splitCSVRow(lines[0]).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const values = splitCSVRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
    return obj;
  });

  return { headers, rows };
}

function splitCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function importPatientsFromCSV(text) {
  const { headers, rows } = parseCSV(text);
  const required = ['firstname', 'lastname'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length) {
    return { success: false, message: `Missing required columns: ${missing.join(', ')}` };
  }

  const patients = DB.getPatients();
  const existingIds = new Set(patients.map(p => p.medicalId).filter(Boolean));
  let added = 0, skipped = 0;

  rows.forEach(row => {
    if (!row.firstname && !row.lastname) { skipped++; return; }
    if (row.medicalid && existingIds.has(row.medicalid)) { skipped++; return; }

    patients.push({
      id:            generateId(),
      firstName:     row.firstname || '',
      lastName:      row.lastname || '',
      dob:           row.dob || '',
      phone:         row.phone || '',
      address:       row.address || '',
      insurance:     row.insurance || '',
      medicalId:     row.medicalid || '',
      mobilityNeeds: row.mobilityneeds || '',
      notes:         row.notes || ''
    });
    if (row.medicalid) existingIds.add(row.medicalid);
    added++;
  });

  DB.savePatients(patients);
  return { success: true, message: `Imported ${added} patient(s). Skipped ${skipped} (duplicates or empty rows).` };
}

function importTripsFromCSV(text) {
  const { headers, rows } = parseCSV(text);
  const required = ['scheduleddate', 'pickupaddress', 'dropoffaddress'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length) {
    return { success: false, message: `Missing required columns: ${missing.join(', ')}` };
  }

  const patients = DB.getPatients();
  const medicalIdMap = Object.fromEntries(
    patients.filter(p => p.medicalId).map(p => [p.medicalId, p.id])
  );

  const trips = DB.getTrips();
  let added = 0, skipped = 0;

  rows.forEach(row => {
    if (!row.scheduleddate || !row.pickupaddress || !row.dropoffaddress) { skipped++; return; }

    // Resolve patient by medicalId if provided
    let patientId = '';
    if (row.medicalid && medicalIdMap[row.medicalid]) {
      patientId = medicalIdMap[row.medicalid];
    }

    trips.push({
      id:            generateId(),
      patientId,
      scheduledDate: row.scheduleddate || '',
      scheduledTime: row.scheduledtime || '',
      pickupAddress: row.pickupaddress || '',
      dropoffAddress:row.dropoffaddress || '',
      tripType:      row.triptype || 'Medical Appointment',
      status:        row.status || 'scheduled',
      driverNotes:   row.drivernotes || ''
    });
    added++;
  });

  DB.saveTrips(trips);
  return { success: true, message: `Imported ${added} trip(s). Skipped ${skipped} (incomplete rows).` };
}

/* ============================================================
   CSV EXPORT
   ============================================================ */
function objectsToCSV(objects, columns) {
  if (objects.length === 0) return columns.join(',') + '\n';
  const header = columns.join(',');
  const rows = objects.map(obj =>
    columns.map(col => {
      const val = obj[col] !== undefined && obj[col] !== null ? String(obj[col]) : '';
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadTemplate(filename, columns) {
  downloadCSV(filename, columns.join(',') + '\n');
}

/* ============================================================
   SETUP EVENT LISTENERS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation ---
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.view);
    });
  });

  // --- Mobile menu toggle ---
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Tap outside sidebar to close
  document.getElementById('mainContent').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });

  // --- Modal buttons ---
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalSaveBtn').addEventListener('click', () => {
    if (_onModalSave && _onModalSave() !== false) {
      closeModal();
    }
  });

  // Close modal on overlay click
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // --- Patients ---
  document.getElementById('addPatientBtn').addEventListener('click', openAddPatient);
  document.getElementById('patientSearch').addEventListener('input', e => renderPatients(e.target.value));

  // --- Trips ---
  document.getElementById('addTripBtn').addEventListener('click', openAddTrip);
  document.getElementById('tripSearch').addEventListener('input', e => renderTrips(e.target.value));

  // Trip status filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      tripStatusFilter = chip.dataset.filter;
      renderTrips();
    });
  });

  // --- Import buttons ---
  document.getElementById('importPatientsBtn').addEventListener('click', () => navigateTo('import'));
  document.getElementById('importTripsBtn').addEventListener('click', () => navigateTo('import'));

  // --- Patient CSV file input ---
  setupFileImport('patientCsvInput', 'patientImportFeedback', (text) => {
    const result = importPatientsFromCSV(text);
    if (result.success) { renderDashboard(); renderPatients(); }
    return result;
  });

  // --- Trip CSV file input ---
  setupFileImport('tripCsvInput', 'tripImportFeedback', (text) => {
    const result = importTripsFromCSV(text);
    if (result.success) { renderDashboard(); renderTrips(); }
    return result;
  });

  // --- Drag-and-drop zones ---
  setupDropZone('patientDropZone', 'patientCsvInput');
  setupDropZone('tripDropZone', 'tripCsvInput');

  // --- Template downloads ---
  document.getElementById('downloadPatientTemplate').addEventListener('click', e => {
    e.preventDefault();
    downloadTemplate('patients-template.csv',
      ['firstName','lastName','dob','phone','address','insurance','medicalId','mobilityNeeds','notes']);
  });

  document.getElementById('downloadTripTemplate').addEventListener('click', e => {
    e.preventDefault();
    downloadTemplate('trips-template.csv',
      ['medicalId','scheduledDate','scheduledTime','pickupAddress','dropoffAddress','tripType','status','driverNotes']);
  });

  // --- Export buttons ---
  document.getElementById('exportPatientsBtn').addEventListener('click', () => {
    const patients = DB.getPatients();
    const cols = ['id','firstName','lastName','dob','phone','address','insurance','medicalId','mobilityNeeds','notes'];
    downloadCSV(`patients-export-${todayStr()}.csv`, objectsToCSV(patients, cols));
    showToast('Patients exported.', 'success');
  });

  document.getElementById('exportTripsBtn').addEventListener('click', () => {
    const trips = DB.getTrips();
    const cols = ['id','patientId','scheduledDate','scheduledTime','pickupAddress','dropoffAddress','tripType','status','driverNotes'];
    downloadCSV(`trips-export-${todayStr()}.csv`, objectsToCSV(trips, cols));
    showToast('Trips exported.', 'success');
  });

  document.getElementById('clearDataBtn').addEventListener('click', () => {
    if (!confirm('This will permanently delete ALL patients and trips. This cannot be undone. Continue?')) return;
    DB.clearAll();
    renderDashboard();
    renderPatients();
    renderTrips();
    showToast('All data cleared.');
  });

  // --- Initial render ---
  renderDashboard();
});

/* ============================================================
   DRAG & DROP + FILE INPUT HELPERS
   ============================================================ */
function setupFileImport(inputId, feedbackId, handler) {
  const input = document.getElementById(inputId);
  const feedback = document.getElementById(feedbackId);

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    readFileAsText(file, text => {
      const result = handler(text);
      showFeedback(feedback, result.message, result.success ? 'success' : 'error');
    });
    input.value = '';
  });
}

function setupDropZone(zoneId, inputId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);

  zone.addEventListener('click', e => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') input.click();
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please drop a .csv file.', 'error');
      return;
    }
    // Simulate input change by assigning to DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
}

function readFileAsText(file, callback) {
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result);
  reader.readAsText(file);
}

function showFeedback(el, message, type) {
  el.textContent = message;
  el.className = `import-feedback ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'import-feedback'; }, 6000);
}
