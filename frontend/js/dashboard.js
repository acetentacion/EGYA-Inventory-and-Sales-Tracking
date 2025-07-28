// ========================
// CONFIG
// ========================
//const API_BASE = 'http://localhost:3000/api';
let salesChartInstance = null; // store the chart instance

// ========================
// DASHBOARD SUMMARY
// ========================
async function loadDashboardSummary() {
  try {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    const data = await res.json();
    console.log("Summary Data:", data);

    document.getElementById('total-products').textContent = data.total_products;
    document.getElementById('total-sales').textContent = `₱${data.total_sales}`;
    document.getElementById('total-profit').textContent = `₱${data.total_profit}`;
    document.getElementById('low-stock').textContent = data.low_stock_count;
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

// ========================
// SALES CHART
// ========================
async function loadSalesChart(type = 'platform') {
  try {
    const res = await fetch(`${API_BASE}/analytics/sales-overview?type=${type}`);
    const data = await res.json();
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Destroy previous chart before creating a new one
    if (salesChartInstance) {
      salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => type === 'platform' ? d.platform : d.product_name),
        datasets: [{
          label: type === 'platform' ? 'Sales by Platform' : 'Sales by Product',
          data: data.map(d => d.total_sold),
          backgroundColor: 'rgba(59, 130, 246, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: type === 'platform' ? 'Sales by Platform' : 'Sales by Product' }
        }
      }
    });
  } catch (err) {
    console.error('Error loading chart:', err);
  }
}

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardSummary();
  loadSalesChart();

  document.getElementById('salesChartType').addEventListener('change', (e) => {
    loadSalesChart(e.target.value);
  });
});
