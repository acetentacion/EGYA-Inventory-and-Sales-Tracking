const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadSalesAnalytics(); // Default tab
});

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('border-blue-500', 'text-blue-600'));
      btn.classList.add('border-blue-500', 'text-blue-600');

      const targetTab = btn.getAttribute('data-tab');
      tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== targetTab);
      });

      // Load chart for selected tab
      if (targetTab === 'sales-tab') loadSalesAnalytics();
      if (targetTab === 'products-tab') loadProductAnalytics();
      if (targetTab === 'profit-tab') loadProfitAnalytics();
    });
  });
}

// Load Sales Analytics
async function loadSalesAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/sales-overview`);
  const data = await res.json();
  renderChart('salesChart', 'Sales by Platform', data.map(d => d.platform), data.map(d => d.total_sold));
}

// Load Product Analytics
async function loadProductAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/sales-by-product`);
  const data = await res.json();
  renderChart('productChart', 'Top Selling Products', data.map(d => d.product), data.map(d => d.total_sold));
}

// Load Profit Analytics
async function loadProfitAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/analytics/profit-overview`);
      const data = await res.json();
  
      // Render Chart
      const ctx = document.getElementById('profitChart').getContext('2d');
      if (window.profitChartInstance) window.profitChartInstance.destroy();
  
      window.profitChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.product_name),
          datasets: [{
            label: 'Profit (₱)',
            data: data.map(d => d.total_profit),
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
  
      // Render Table
      const tableBody = document.getElementById('profitTableBody');
      tableBody.innerHTML = data.map(d => `
        <tr>
          <td class="border px-4 py-2">${d.product_name}</td>
          <td class="border px-4 py-2 text-right">${d.total_sold}</td>
          <td class="border px-4 py-2 text-right">₱${parseFloat(d.total_sales).toFixed(2)}</td>
          <td class="border px-4 py-2 text-right">₱${parseFloat(d.total_profit).toFixed(2)}</td>
        </tr>
      `).join('');
  
    } catch (err) {
      console.error('Error loading profit analytics:', err);
    }
  }
  
  

// Reusable Chart Renderer
function renderChart(canvasId, label, labels, values) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (ctx.chartInstance) ctx.chartInstance.destroy();
  
  ctx.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: 'rgba(59,130,246,0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}
