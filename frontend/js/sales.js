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
        <button onclick="openSalesHistory(${sale.product_id}, '${sale.product_name}')" class="text-blue-500 hover:underline text-sm">View</button>
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
  historyTitle.textContent = `Sales History for ${productName}`;
  historyContent.innerHTML = 'Loading...';
  historyModal.classList.remove('hidden');

  fetchJSON(`${API_BASE}/sales/history/${productId}`)
    .then(sales => {
      historyContent.innerHTML = sales.length
        ? sales.map(s => `
          <div class="border-b pb-2 mb-2">
            <p><strong>Date:</strong> ${new Date(s.date_sold).toLocaleDateString()}</p>
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
