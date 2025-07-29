// 🌍 API Base
//const API_BASE = 'http://localhost:3000/api';

// ======== FETCH HELPER =========
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
}

// ======== LOAD PRODUCTS FOR DROPDOWN =========
async function populateProductDropdown() {
  try {
    const products = await fetchJSON(`${API_BASE}/products`);
    const dropdown = document.getElementById('sale_product');
    dropdown.innerHTML = '<option value="">Select Product</option>';
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.name} (${product.current_stock} in stock)`;
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

// ======== LOAD SALES HISTORY =========
async function loadSales() {
  try {
    const sales = await fetchJSON(`${API_BASE}/sales`);
    console.log("Sales data:", sales); // 👈 Debug here
    const list = document.getElementById('sales-list');
    list.innerHTML = '';
    if (sales.length === 0) {
      list.innerHTML = `<p class="text-gray-500">No sales recorded yet.</p>`;
      return;
    }
    sales.forEach(sale => {
      const div = document.createElement('div');
      div.className = "p-2 bg-gray-50 rounded shadow-sm flex justify-between items-center";
      div.innerHTML = `
        <span><strong>${sale.product_name}</strong> sold ${sale.quantity} pcs via ${sale.platform}</span>
        <button onclick="openSalesHistory(${sale.product_id}, '${sale.product_name.replace(/'/g, "\\'")}')" 
          class="text-blue-500 hover:underline text-sm">View</button>
      `;
      list.appendChild(div);
    });
    
  } catch (err) {
    console.error('Error loading sales:', err);
  } 
}

// ======== RECORD SALE =========
document.getElementById('sales-form')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const sale = {
    product_id: parseInt(document.getElementById('sale_product').value),
    quantity: parseInt(document.getElementById('sale_quantity').value),
    platform: document.getElementById('sale_platform').value
  };

  if (!sale.product_id || !sale.quantity || !sale.platform) {
    alert('❌ Please fill out all fields');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });

    if (res.ok) {
      alert('✅ Sale recorded!');
      this.reset();
      loadSales();
      populateProductDropdown();
    } else {
      alert('❌ Error recording sale.');
    }
  } catch (err) {
    alert('❌ Request failed.');
  }
});

// ======== SALES HISTORY MODAL =========
const historyModal = document.getElementById('history-modal');
const historyContent = document.getElementById('history-content');
const historyTitle = document.getElementById('history-title');

function openSalesHistory(productId, productName) {
  console.log("Opening history for:", productId, productName); 
  historyTitle.textContent = `Sales History for ${productName}`;
  historyContent.innerHTML = 'Loading...';
  historyModal.classList.remove('hidden');

  fetchJSON(`${API_BASE}/sales/history/${productId}`)
    .then(sales => {
      console.log("Sales history data:", sales); 
      historyContent.innerHTML = sales.length
        ? sales.map(s => `
          <div class="border-b pb-2 mb-2">
          <p><strong>Date:</strong> ${s.date_sold ? new Date(s.date_sold).toLocaleDateString() : 'No date available'}</p>
            <p><strong>Quantity:</strong> ${s.quantity}</p>
            <p><strong>Platform:</strong> ${s.platform}</p>
          </div>
        `).join('')
        : '<p class="text-gray-500">No history available.</p>';
    })
    .catch(() => historyContent.innerHTML = '<p class="text-red-500">Error loading history.</p>');
}




document.getElementById('close-history')?.addEventListener('click', () => {
  historyModal.classList.add('hidden');
});

// ======== INIT =========
document.addEventListener('DOMContentLoaded', () => {
  populateProductDropdown();
  loadSales();
});

document.getElementById('month-selector').addEventListener('change', async (e) => {
  const month = e.target.value;
  if (!month) return;

  try {
    const res = await fetch(`${API_BASE}/sales/summary/${month}`);
    const data = await res.json();

    document.getElementById('monthly-sales').textContent = `₱${data.total_sales || 0}`;
    document.getElementById('monthly-profit').textContent = `₱${data.total_profit || 0}`;
  } catch (err) {
    console.error('Error fetching monthly summary:', err);
  }
});

let monthlyTrendChartInstance = null;

async function loadMonthlyTrend(month) {
  try {
    const res = await fetch(`${API_BASE}/sales/monthly-trend/${month}`);
    const data = await res.json();

    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');

    // Destroy old chart
    if (monthlyTrendChartInstance) {
      monthlyTrendChartInstance.destroy();
    }

    monthlyTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Sales (₱)',
            data: data.map(d => d.total_sales),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Profit (₱)',
            data: data.map(d => d.total_profit),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `₱${context.raw.toLocaleString()}`
            }
          }
        }
      }
    });

  } catch (err) {
    console.error('Error loading monthly trend:', err);
  }
}

document.getElementById('month-selector')?.addEventListener('change', (e) => {
  const month = e.target.value;
  if (month) {
    loadMonthlyTrend(month);
  }
});
