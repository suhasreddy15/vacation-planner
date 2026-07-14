// Global State Object
const state = {
  overview: null,
  charts: null,
  tables: null,
  activeTab: 'overview',
  theme: 'dark',
  chartInstances: {}
};

// Dom elements
const elements = {
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  refreshBtn: document.getElementById('refresh-data-btn'),
  pageTitleHeading: document.getElementById('page-title-heading'),
  pageSubtitle: document.getElementById('page-subtitle'),
  modal: document.getElementById('detail-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalCloseActionBtn: document.getElementById('modal-close-action-btn'),
  sidebarItems: document.querySelectorAll('.sidebar-nav li'),
  panels: document.querySelectorAll('.tab-panel')
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load Theme
  const savedTheme = localStorage.getItem('voyageiq-analytics-theme') || 'dark';
  setTheme(savedTheme);

  // Set event listeners
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  elements.refreshBtn.addEventListener('click', refreshAllData);
  elements.modalCloseBtn.addEventListener('click', closeModal);
  elements.modalCloseActionBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking outside
  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) closeModal();
  });

  // Sidebar Tab switching
  elements.sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = item.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Table Searching and Filtering listeners
  setupTableListeners();

  // Export CSV listeners
  document.querySelectorAll('.btn-export').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      exportTableToCSV(target);
    });
  });

  // Fetch initial data
  fetchAllData();
}

// Theme handling
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('voyageiq-analytics-theme', theme);
  
  const textLabel = document.querySelector('.theme-label');
  if (textLabel) {
    textLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  }

  // Re-render charts with updated grid / text colors if chartInstances exist
  if (Object.keys(state.chartInstances).length > 0) {
    updateChartThemeStyles();
  }
}

function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// Tab Switching
function switchTab(tabName) {
  state.activeTab = tabName;
  
  // Update sidebar active class
  elements.sidebarItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Show/Hide Panels
  elements.panels.forEach(panel => {
    if (panel.id === `tab-${tabName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update Page Header Info
  const tabTitles = {
    overview: { title: 'Overview', sub: 'Real-time vacation planner performance & insights' },
    bookings: { title: 'Bookings', sub: 'Manage and inspect traveler trip packages reservation list' },
    trips: { title: 'Trips', sub: 'Analyze individual trip performances, revenues and ratings' },
    'ai-planner': { title: 'AI Planner requests', sub: 'Explore plans generated dynamically by VoyageIQ AI Assistant' },
    users: { title: 'User Cohorts', sub: 'Review traveler, organizer and administrator details' },
    reviews: { title: 'Customer Feedback', sub: 'Inspect reviews, opinions and user satisfaction ratings' }
  };

  const titleInfo = tabTitles[tabName] || { title: 'Dashboard', sub: '' };
  elements.pageTitleHeading.textContent = titleInfo.title;
  elements.pageSubtitle.textContent = titleInfo.sub;

  // Reactivate Lucide icons
  lucide.createIcons();
}

// Fetch all Data
async function fetchAllData() {
  showLoader();
  try {
    const [overviewRes, chartsRes, tablesRes] = await Promise.all([
      fetch('/api/analytics/overview'),
      fetch('/api/analytics/charts'),
      fetch('/api/analytics/tables')
    ]);

    if (!overviewRes.ok || !chartsRes.ok || !tablesRes.ok) {
      throw new Error("Failed to load dashboard data. Check database connections.");
    }

    state.overview = await overviewRes.json();
    state.charts = await chartsRes.json();
    state.tables = await tablesRes.json();

    renderOverviewKPIs();
    renderCharts();
    renderTables();
    
    lucide.createIcons();
  } catch (err) {
    console.error(err);
    alert("Error fetching database metrics: " + err.message);
  } finally {
    hideLoader();
  }
}

async function refreshAllData() {
  const icon = elements.refreshBtn.querySelector('i');
  if (icon) icon.classList.add('spinning');
  
  await fetchAllData();
  
  if (icon) icon.classList.remove('spinning');
}

function showLoader() {
  elements.refreshBtn.disabled = true;
}

function hideLoader() {
  elements.refreshBtn.disabled = false;
}

// Formatting helpers
function formatCurrency(amount) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
  return formatter.format(amount);
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Render Overview KPI metrics
function renderOverviewKPIs() {
  const data = state.overview;
  if (!data) return;

  document.getElementById('kpi-revenue').textContent = formatCurrency(data.total_revenue);
  document.getElementById('kpi-bookings').textContent = data.total_bookings;
  document.getElementById('kpi-trips').textContent = `${data.active_trips}/${data.total_trips}`;
  document.getElementById('kpi-rating').textContent = data.avg_rating.toFixed(1);
  document.getElementById('kpi-ai-plans').textContent = data.total_ai_plans;

  // Set booking confirmed helper subtext
  const confirmedCount = data.booking_status_breakdown['confirmed'] || 0;
  const completedCount = data.booking_status_breakdown['completed'] || 0;
  document.getElementById('kpi-bookings-confirmed-sub').innerHTML = 
    `<i data-lucide="check-circle" style="width:12px;height:12px;display:inline;"></i> ${confirmedCount + completedCount} Confirmed/Paid`;

  // Set trips ratio subtext
  const liveRatio = data.total_trips > 0 ? Math.round((data.active_trips / data.total_trips) * 100) : 0;
  document.getElementById('kpi-trips-ratio').textContent = `${liveRatio}% active rate`;
}

// Chart Themes and styling
function getChartThemeColors() {
  const isDark = state.theme === 'dark';
  return {
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
    cardBg: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    accentBlue: '#3b82f6',
    accentPurple: '#8b5cf6',
    accentEmerald: '#10b981',
    accentAmber: '#f59e0b',
    accentPink: '#ec4899',
  };
}

function updateChartThemeStyles() {
  const colors = getChartThemeColors();
  
  Object.values(state.chartInstances).forEach(chart => {
    if (chart.options.scales) {
      Object.values(chart.options.scales).forEach(scale => {
        if (scale.ticks) scale.ticks.color = colors.text;
        if (scale.grid) scale.grid.color = colors.grid;
        if (scale.title) scale.title.color = colors.text;
      });
    }
    if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
      chart.options.plugins.legend.labels.color = colors.text;
    }
    chart.update();
  });
}

// Render Charts
function renderCharts() {
  const chartData = state.charts;
  if (!chartData) return;

  const colors = getChartThemeColors();

  // Clear existing instances to avoid duplicates
  Object.values(state.chartInstances).forEach(chart => chart.destroy());
  state.chartInstances = {};

  // 1. Monthly Trends mixed chart (Line + Bar)
  const trendsCtx = document.getElementById('chart-trends').getContext('2d');
  const trendsMonths = chartData.booking_trends.map(t => t.month);
  const trendsRevenue = chartData.booking_trends.map(t => t.revenue);
  const trendsCounts = chartData.booking_trends.map(t => t.bookings);

  state.chartInstances.trends = new Chart(trendsCtx, {
    type: 'bar',
    data: {
      labels: trendsMonths,
      datasets: [
        {
          label: 'Revenue (₹)',
          data: trendsRevenue,
          backgroundColor: 'rgba(59, 130, 246, 0.55)',
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderRadius: 4,
          yAxisID: 'yRevenue',
          order: 2
        },
        {
          label: 'Bookings Count',
          data: trendsCounts,
          type: 'line',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          yAxisID: 'yBookings',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: colors.text, font: { family: 'Plus Jakarta Sans' } } },
        tooltip: {
          padding: 12,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.datasetIndex === 0) {
                label += formatCurrency(context.raw);
              } else {
                label += context.raw;
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' } }
        },
        yRevenue: {
          type: 'linear',
          position: 'left',
          grid: { color: colors.grid },
          ticks: { 
            color: colors.text,
            font: { family: 'Plus Jakarta Sans' },
            callback: value => '₹' + value.toLocaleString('en-IN')
          },
          title: { display: true, text: 'Revenue (₹)', color: colors.text }
        },
        yBookings: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' }, stepSize: 1 },
          title: { display: true, text: 'Bookings', color: colors.text }
        }
      }
    }
  });

  // 2. Revenue by Category (Doughnut Chart)
  const categoriesCtx = document.getElementById('chart-categories').getContext('2d');
  const catLabels = chartData.category_revenue.map(c => c.category);
  const catRevenues = chartData.category_revenue.map(c => c.revenue);

  state.chartInstances.categories = new Chart(categoriesCtx, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catRevenues,
        backgroundColor: [
          'rgba(59, 130, 246, 0.75)',
          'rgba(139, 92, 246, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(236, 72, 153, 0.75)'
        ],
        borderColor: colors.grid,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: colors.text, font: { family: 'Plus Jakarta Sans' } }
        },
        tooltip: {
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // 3. AI Travel Styles requests (Vertical Bar)
  const stylesCtx = document.getElementById('chart-ai-styles').getContext('2d');
  const styleLabels = chartData.ai_styles.map(s => s.style);
  const styleCounts = chartData.ai_styles.map(s => s.count);

  state.chartInstances.styles = new Chart(stylesCtx, {
    type: 'bar',
    data: {
      labels: styleLabels,
      datasets: [{
        label: 'Inquiries count',
        data: styleCounts,
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: '#8b5cf6',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { padding: 12 }
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' } }
        },
        y: {
          grid: { color: colors.grid },
          ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' }, stepSize: 1 },
          title: { display: true, text: 'Inquiry count', color: colors.text }
        }
      }
    }
  });

  // 4. Popular Destinations (Horizontal Bar)
  const destCtx = document.getElementById('chart-ai-destinations').getContext('2d');
  const destLabels = chartData.popular_destinations.map(d => d.destination);
  const destCounts = chartData.popular_destinations.map(d => d.count);

  state.chartInstances.destinations = new Chart(destCtx, {
    type: 'bar',
    data: {
      labels: destLabels,
      datasets: [{
        label: 'Planner requests',
        data: destCounts,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { padding: 12 }
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' }, stepSize: 1 }
        },
        y: {
          grid: { color: colors.grid },
          ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' } }
        }
      }
    }
  });
}

// Render Tables
function renderTables() {
  if (!state.tables) return;

  renderBookingsTable();
  renderTripsTable();
  renderAITable();
  renderUsersTable();
  renderReviewsTable();
}

// --- BOOKINGS ---
function renderBookingsTable() {
  const tbody = document.querySelector('#table-bookings-list tbody');
  tbody.innerHTML = '';
  
  const filtered = filterData(state.tables.bookings, 'search-bookings', 'filter-bookings-status', (item, query, statusVal) => {
    const matchesSearch = item.user_name.toLowerCase().includes(query) || 
                          item.user_email.toLowerCase().includes(query) || 
                          item.trip_name.toLowerCase().includes(query) || 
                          item.status.toLowerCase().includes(query);
    const matchesFilter = statusVal === 'all' || item.status.toLowerCase() === statusVal.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);font-style:italic;padding:30px;">No bookings found matching filters.</td></tr>';
    return;
  }

  filtered.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${b.id}</td>
      <td>
        <div style="font-weight:600;">${b.user_name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${b.user_email}</div>
      </td>
      <td style="font-weight:500;">${b.trip_name}</td>
      <td>${formatDate(b.travel_date)}</td>
      <td>${b.travelers_count}</td>
      <td style="font-weight:600;">${formatCurrency(b.total_price)}</td>
      <td><span class="status-pill ${b.status.toLowerCase()}">${b.status}</span></td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${formatDateTime(b.created_at)}</td>
      <td>
        <button class="btn btn-outline btn-sm view-booking-details-btn" data-id="${b.id}">
          <i data-lucide="eye" style="width:12px;height:12px;"></i> View Specs
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind view specs event
  tbody.querySelectorAll('.view-booking-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bId = parseInt(btn.getAttribute('data-id'));
      const booking = state.tables.bookings.find(x => x.id === bId);
      openBookingModal(booking);
    });
  });
}

function openBookingModal(b) {
  elements.modalTitle.textContent = `Booking Info: #${b.id}`;
  elements.modalBody.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div class="detail-item">
        <div class="detail-label">Traveler Name</div>
        <div class="detail-value">${b.user_name}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Email Address</div>
        <div class="detail-value">${b.user_email}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Trip Package</div>
        <div class="detail-value">${b.trip_name}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Destination Location</div>
        <div class="detail-value">${b.trip_location}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Travel Date</div>
        <div class="detail-value">${formatDate(b.travel_date)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Travelers Count</div>
        <div class="detail-value">${b.travelers_count} travelers</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Total Price Paid</div>
        <div class="detail-value" style="font-weight:700; color:var(--accent-emerald);">${formatCurrency(b.total_price)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>
        </div>
      </div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Special Inquiries / Requests</div>
      <div class="pre-wrapped">${b.special_requests || 'No special requirements listed.'}</div>
    </div>
    <div class="detail-item" style="margin-top:16px;">
      <div class="detail-label">Booking Generated At</div>
      <div class="detail-value" style="font-size:0.85rem;color:var(--text-muted);">${formatDateTime(b.created_at)}</div>
    </div>
  `;
  openModal();
}

// --- TRIPS ---
function renderTripsTable() {
  const tbody = document.querySelector('#table-trips-list tbody');
  tbody.innerHTML = '';

  const filtered = filterData(state.tables.trips, 'search-trips', 'filter-trips-status', (item, query, statusVal) => {
    const matchesSearch = item.name.toLowerCase().includes(query) || 
                          item.location.toLowerCase().includes(query) || 
                          item.category.toLowerCase().includes(query);
    const matchesStatus = statusVal === 'all' || 
                          (statusVal === 'active' && item.is_active) || 
                          (statusVal === 'inactive' && !item.is_active);
    return matchesSearch && matchesStatus;
  });

  // Secondary filter by category
  const catVal = document.getElementById('filter-trips-category').value;
  const doublyFiltered = filtered.filter(item => {
    return catVal === 'all' || item.category.toLowerCase() === catVal.toLowerCase();
  });

  if (doublyFiltered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);font-style:italic;padding:30px;">No trip packages found.</td></tr>';
    return;
  }

  doublyFiltered.forEach(t => {
    const tr = document.createElement('tr');
    const statusText = t.is_active ? 'Active' : 'Inactive';
    const statusClass = t.is_active ? 'active' : 'inactive';
    tr.innerHTML = `
      <td>#${t.id}</td>
      <td>
        <div style="font-weight:600;">${t.name}</div>
        ${t.is_featured ? '<span class="badge badge-primary" style="font-size:0.55rem;padding:1px 4px;margin-top:2px;display:inline-block;">Featured</span>' : ''}
      </td>
      <td><span class="badge" style="background:rgba(255,255,255,0.06);color:var(--text-main);border:1px solid var(--border-color);">${t.category}</span></td>
      <td>${t.location}</td>
      <td>${t.duration_days}d / ${t.duration_nights}n</td>
      <td style="font-weight:500;">${formatCurrency(t.price)}</td>
      <td>${t.bookings_count} bookings</td>
      <td style="font-weight:600;color:var(--accent-emerald);">${formatCurrency(t.total_revenue)}</td>
      <td>
        <div class="rating-stars">
          <i data-lucide="star"></i> ${t.avg_rating > 0 ? t.avg_rating.toFixed(1) : 'No reviews'}
        </div>
      </td>
      <td><span class="status-pill ${statusClass}">${statusText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- AI PLANNER ---
function renderAITable() {
  const tbody = document.querySelector('#table-ai-plans-list tbody');
  tbody.innerHTML = '';

  const filtered = filterData(state.tables.ai_plans, 'search-ai-plans', 'filter-ai-style', (item, query, styleVal) => {
    const matchesSearch = item.user_name.toLowerCase().includes(query) || 
                          item.user_email.toLowerCase().includes(query) || 
                          item.destination.toLowerCase().includes(query) ||
                          item.travel_style.toLowerCase().includes(query);
    const matchesFilter = styleVal === 'all' || item.travel_style.toLowerCase() === styleVal.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);font-style:italic;padding:30px;">No custom itineraries generated.</td></tr>';
    return;
  }

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${p.id}</td>
      <td>
        <div style="font-weight:600;">${p.user_name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${p.user_email}</div>
      </td>
      <td style="font-weight:600;">${p.destination}</td>
      <td>${formatCurrency(p.budget)}</td>
      <td>${p.number_of_days} days</td>
      <td>${p.travelers_count}</td>
      <td><span class="status-pill role-organizer">${p.travel_style}</span></td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${formatDateTime(p.created_at)}</td>
      <td>
        <button class="btn btn-outline btn-sm view-ai-plan-btn" data-id="${p.id}">
          <i data-lucide="sparkles" style="width:12px;height:12px;"></i> View Plan
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind view specs event
  tbody.querySelectorAll('.view-ai-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = parseInt(btn.getAttribute('data-id'));
      const plan = state.tables.ai_plans.find(x => x.id === pId);
      openAIPlanModal(plan);
    });
  });
}

function openAIPlanModal(p) {
  elements.modalTitle.textContent = `AI Custom Plan: ${p.destination}`;
  elements.modalBody.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div class="detail-item">
        <div class="detail-label">Requested by</div>
        <div class="detail-value">${p.user_name} (${p.user_email})</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Destination</div>
        <div class="detail-value">${p.destination}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Budget Allocated</div>
        <div class="detail-value">${formatCurrency(p.budget)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Duration & travelers</div>
        <div class="detail-value">${p.number_of_days} days | ${p.travelers_count} travelers</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Travel Style Preference</div>
        <div class="detail-value">
          <span class="status-pill role-organizer">${p.travel_style}</span>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Generated Date</div>
        <div class="detail-value">${formatDateTime(p.created_at)}</div>
      </div>
    </div>
    <div class="detail-item">
      <div class="detail-label">AI System Generated Itinerary</div>
      <div class="pre-wrapped" style="font-family:monospace; font-size:0.8rem; line-height:1.4;">${p.generated_plan || 'Error: Plan itinerary body is empty.'}</div>
    </div>
  `;
  openModal();
}

// --- USERS ---
function renderUsersTable() {
  const tbody = document.querySelector('#table-users-list tbody');
  tbody.innerHTML = '';

  const filtered = filterData(state.tables.users, 'search-users', 'filter-users-role', (item, query, roleVal) => {
    const matchesSearch = item.name.toLowerCase().includes(query) || 
                          item.email.toLowerCase().includes(query) || 
                          (item.phone && item.phone.toLowerCase().includes(query));
    const matchesFilter = roleVal === 'all' || item.role.toLowerCase() === roleVal.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-style:italic;padding:30px;">No registered accounts found.</td></tr>';
    return;
  }

  filtered.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${u.id}</td>
      <td style="font-weight:600;">${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone || '<span style="color:var(--text-muted);font-style:italic;">No phone</span>'}</td>
      <td><span class="status-pill role-${u.role.toLowerCase()}">${u.role}</span></td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${formatDateTime(u.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- REVIEWS ---
function renderReviewsTable() {
  const tbody = document.querySelector('#table-reviews-list tbody');
  tbody.innerHTML = '';

  const filtered = filterData(state.tables.reviews, 'search-reviews', 'filter-reviews-rating', (item, query, ratingVal) => {
    const matchesSearch = item.user_name.toLowerCase().includes(query) || 
                          item.trip_name.toLowerCase().includes(query) || 
                          (item.review_text && item.review_text.toLowerCase().includes(query));
    const matchesFilter = ratingVal === 'all' || item.rating === parseInt(ratingVal);
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-style:italic;padding:30px;">No client feedback items found.</td></tr>';
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement('tr');
    
    // Draw rating stars
    let starsHtml = '<div class="rating-stars">';
    for (let i = 1; i <= 5; i++) {
      if (i <= r.rating) {
        starsHtml += '<i data-lucide="star"></i>';
      } else {
        starsHtml += '<span class="empty-star"><i data-lucide="star"></i></span>';
      }
    }
    starsHtml += ` <span>${r.rating}/5</span></div>`;

    tr.innerHTML = `
      <td>#${r.id}</td>
      <td>
        <div style="font-weight:600;">${r.user_name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${r.user_email}</div>
      </td>
      <td style="font-weight:500;">${r.trip_name}</td>
      <td>${starsHtml}</td>
      <td style="max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.review_text || ''}">
        ${r.review_text || '<span style="color:var(--text-muted);font-style:italic;">No text provided</span>'}
      </td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${formatDateTime(r.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Table listeners helper
function setupTableListeners() {
  // Live searches
  const searches = ['search-bookings', 'search-trips', 'search-ai-plans', 'search-users', 'search-reviews'];
  searches.forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (id === 'search-bookings') renderBookingsTable();
      if (id === 'search-trips') renderTripsTable();
      if (id === 'search-ai-plans') renderAITable();
      if (id === 'search-users') renderUsersTable();
      if (id === 'search-reviews') renderReviewsTable();
    });
  });

  // Dropdown filters
  const filters = [
    'filter-bookings-status', 
    'filter-trips-status', 
    'filter-trips-category', 
    'filter-ai-style', 
    'filter-users-role', 
    'filter-reviews-rating'
  ];
  filters.forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      if (id.includes('bookings')) renderBookingsTable();
      if (id.includes('trips')) renderTripsTable();
      if (id.includes('ai-style')) renderAITable();
      if (id.includes('users')) renderUsersTable();
      if (id.includes('reviews')) renderReviewsTable();
    });
  });
}

// Filter dataset base helper
function filterData(dataList, searchInputId, filterDropdownId, checkFn) {
  if (!dataList) return [];
  const query = document.getElementById(searchInputId).value.toLowerCase().trim();
  const filterVal = document.getElementById(filterDropdownId).value;
  
  return dataList.filter(item => checkFn(item, query, filterVal));
}

// Modals toggle
function openModal() {
  elements.modal.classList.add('active');
  lucide.createIcons();
}

function closeModal() {
  elements.modal.classList.remove('active');
}

// Export Table to CSV
function exportTableToCSV(targetKey) {
  if (!state.tables || !state.tables[targetKey]) {
    alert("No data available to export.");
    return;
  }

  let data = [];
  let headers = [];
  let filename = `voyageiq_${targetKey}_export_${new Date().toISOString().split('T')[0]}.csv`;

  if (targetKey === 'bookings') {
    headers = ['Booking ID', 'Traveler Name', 'Traveler Email', 'Trip Package', 'Location', 'Travel Date', 'Travelers Count', 'Total Price (INR)', 'Status', 'Booking Date'];
    data = state.tables.bookings.map(b => [
      b.id, b.user_name, b.user_email, b.trip_name, b.trip_location, b.travel_date, b.travelers_count, b.total_price, b.status, b.created_at
    ]);
  } else if (targetKey === 'trips') {
    headers = ['Trip ID', 'Package Name', 'Category', 'Location', 'Duration Days', 'Duration Nights', 'Base Price (INR)', 'Bookings Count', 'Revenue Generated (INR)', 'Avg Rating', 'Status'];
    data = state.tables.trips.map(t => [
      t.id, t.name, t.category, t.location, t.duration_days, t.duration_nights, t.price, t.bookings_count, t.total_revenue, t.avg_rating, t.is_active ? 'Active' : 'Inactive'
    ]);
  } else if (targetKey === 'ai-plans') {
    headers = ['Plan ID', 'User Name', 'User Email', 'Destination', 'Budget (INR)', 'Days', 'Travelers', 'Travel Style', 'Generated Date'];
    data = state.tables.ai_plans.map(p => [
      p.id, p.user_name, p.user_email, p.destination, p.budget, p.number_of_days, p.travelers_count, p.travel_style, p.created_at
    ]);
  } else if (targetKey === 'users') {
    headers = ['User ID', 'Full Name', 'Email Address', 'Phone Number', 'Role', 'Registration Date'];
    data = state.tables.users.map(u => [
      u.id, u.name, u.email, u.phone || 'N/A', u.role, u.created_at
    ]);
  } else if (targetKey === 'reviews') {
    headers = ['Review ID', 'User Name', 'User Email', 'Trip Package', 'Rating (Stars)', 'Comment', 'Submitted Date'];
    data = state.tables.reviews.map(r => [
      r.id, r.user_name, r.user_email, r.trip_name, r.rating, r.review_text || '', r.created_at
    ]);
  }

  // Convert to CSV string
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Append headers
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\r\n";
  
  // Append row values
  data.forEach(row => {
    const csvRow = row.map(val => {
      let strVal = val === null || val === undefined ? '' : String(val);
      // Escape double quotes
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(",");
    csvContent += csvRow + "\r\n";
  });

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
