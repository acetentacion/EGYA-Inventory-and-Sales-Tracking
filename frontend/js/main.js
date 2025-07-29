async function loadProducts(searchFilter = '', categoryFilter = '') {
  const res = await fetch('http://localhost:3000/api/products');
  const data = await res.json();

  const productList = document.getElementById('product-list');
  productList.innerHTML = '';

  const filtered = data.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  filtered.forEach(product => {
    // Stock color badge
    let stockColor = 'bg-green-100 text-green-800';
    if (product.current_stock <= 5) stockColor = 'bg-red-100 text-red-800';
    else if (product.current_stock <= 15) stockColor = 'bg-yellow-100 text-yellow-800';

    const div = document.createElement('div');
    div.className = 'bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between';

    div.innerHTML = `
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
              <span class="text-xs px-2 py-1 rounded ${stockColor}">${product.current_stock} in stock</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">SKU: ${product.sku}</p>
            <p class="text-sm text-gray-500">Category: ${product.category}</p>
          </div>
      
          <div class="grid grid-cols-2 gap-2 mt-3">
            <button onclick='openRestockModal(${JSON.stringify(product)})' 
              class="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-sm">Restock</button>
            <button onclick="editProduct(${product.id})" 
              class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded text-sm">Edit</button>
            <button onclick="deleteProduct(${product.id})" 
              class="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-sm">Delete</button>
            <button onclick='openSalesHistory(${product.id}, "${product.name.replace(/"/g, '&quot;')}")' 
              class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-sm">View History</button>
          </div>
        `;

    productList.appendChild(div);
  });







  const lowStockCount = filtered.filter(p => p.current_stock <= 5).length;
  const lowStockAlert = document.getElementById('low-stock-alert');
  const lowStockCountSpan = document.getElementById('low-stock-count');

  if (lowStockCount > 0) {
    lowStockCountSpan.textContent = lowStockCount;
    lowStockAlert.classList.remove('hidden');
  } else {
    lowStockAlert.classList.add('hidden');
  }



}




function editProduct(id) {
  fetch(`http://localhost:3000/api/products`)
    .then(res => res.json())
    .then(products => {
      const product = products.find(p => p.id === id);
      if (product) {
        // Populate form with product data
        document.getElementById('name').value = product.name;
        document.getElementById('sku').value = product.sku;
        document.getElementById('category').value = product.category;
        document.getElementById('cost_price').value = product.cost_price;
        document.getElementById('sell_price').value = product.sell_price;
        document.getElementById('current_stock').value = product.current_stock;
        document.getElementById('product_id').value = product.id;
        document.getElementById('add-button').textContent = 'Update Product';
      }
    });
}

function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(() => {
        alert('🗑️ Product deleted');
        loadProducts();
      });
  }
}


async function loadSales() {
  const res = await fetch('http://localhost:3000/api/sales');
  const sales = await res.json();
  const list = document.getElementById('sales-list');
  list.innerHTML = '';

  sales.forEach(sale => {
    const div = document.createElement('div');
    div.className = "p-2 bg-white rounded shadow";
    div.innerHTML = `<strong>${sale.product_name}</strong> sold ${sale.quantity} pcs via ${sale.platform} <br><small>${new Date(sale.date).toLocaleString()}</small>`;
    list.appendChild(div);
  });
}


async function populateProductDropdown() {
  const response = await fetch('http://localhost:3000/api/products');
  const data = await response.json();
  const dropdown = document.getElementById('sale_product');

  dropdown.innerHTML = '<option value="">Select Product</option>';
  data.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = `${product.name} (${product.current_stock} in stock)`;
    dropdown.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts(); // Auto-load products on page open
  const searchInput = document.getElementById('product-search');
  const categorySelect = document.getElementById('category-filter');

  function applyFilters() {
    const searchTerm = searchInput.value;
    const selectedCategory = categorySelect.value;
    loadProducts(searchTerm, selectedCategory);
  }

  searchInput.addEventListener('input', applyFilters);
  categorySelect.addEventListener('change', applyFilters);

  const chartTypeSelect = document.getElementById('salesChartType');
  chartTypeSelect.addEventListener('change', () => {
    loadSalesChart(chartTypeSelect.value);
  });



  loadSales();
  loadTotalProfit()
  loadProfitBreakdowns()
  populateProductDropdown()
  populateCategoryDropdown();
  loadSummaryStats();

  // Handle product list button clicks
  document.getElementById('product-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      editProduct(e.target.dataset.id);
    }

    if (e.target.classList.contains('delete-btn')) {
      deleteProduct(e.target.dataset.id);
    }

    if (e.target.classList.contains('history-btn')) {
      openSalesHistory(e.target.dataset.id, e.target.dataset.name);
    }

    if (e.target.classList.contains('restock-btn')) {
      const product = JSON.parse(decodeURIComponent(e.target.dataset.product));
      openRestockModal(product);
    }
  });


  // 🧾 Sale submission
  document.getElementById('sales-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const sale = {
      product_id: parseInt(document.getElementById('sale_product').value),
      quantity: parseInt(document.getElementById('sale_quantity').value),
      platform: document.getElementById('sale_platform').value.trim()
    };

    if (isNaN(sale.product_id) || isNaN(sale.quantity) || sale.platform === '') {
      alert('❌ Please fill out all fields correctly before recording the sale.');
      return;
    }


    try {
      const res = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sale)
      });

      const result = await res.json();

      if (res.ok) {
        alert('✅ Sale recorded!');
        this.reset();
        loadProducts(); // refresh stock
        loadSales(); // refresh sales list

      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (err) {
      alert('❌ Request failed: ' + err.message);
    }
  });

  // 📦 Product creation
  document.getElementById('product-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const product = {
      name: document.getElementById('name').value,
      sku: document.getElementById('sku').value,
      category: document.getElementById('category').value,
      cost_price: parseFloat(document.getElementById('cost_price').value),
      sell_price: parseFloat(document.getElementById('sell_price').value),
      current_stock: parseInt(document.getElementById('current_stock').value)
    };

    const productId = document.getElementById('product_id').value;
    const isEdit = productId !== "";

    try {
      const res = await fetch(`http://localhost:3000/api/products${isEdit ? '/' + productId : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });

      if (res.ok) {
        alert(isEdit ? '✏️ Product updated!' : '✅ Product added!');
        this.reset();
        document.getElementById('product_id').value = '';
        document.getElementById('add-button').textContent = 'Add Product';
        loadProducts();
      } else {
        const data = await res.json();
        alert('❌ Error: ' + data.error);
      }
    } catch (err) {
      alert('❌ Request failed: ' + err.message);
    }

  });
});

async function populateCategoryDropdown() {
  const dropdown = document.getElementById('category-filter');
  try {
    const res = await fetch('http://localhost:3000/api/products/categories');
    const categories = await res.json();

    dropdown.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

async function loadSalesChart() {
  const res = await fetch('http://localhost:3000/api/analytics/sales-overview');
  const data = await res.json();

  const ctx = document.getElementById('salesChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.platform),
      datasets: [{
        label: 'Units Sold',
        data: data.map(d => d.total_sold),
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Sales by Platform'
        }
      }
    }
  });
}

async function loadProfitBreakdowns() {
  // 📦 By Platform
  const platformRes = await fetch('http://localhost:3000/api/analytics/profit-by-platform');
  const platformData = await platformRes.json();
  const platformBreakdown = platformData.map(p =>
    `<div class="flex justify-between"><span>${p.platform}</span><span>₱${Number(p.profit).toFixed(2)}</span></div>`
  ).join('');
  document.getElementById('platform-profit').innerHTML = platformBreakdown;

  // 🛍️ By Product
  const productRes = await fetch('http://localhost:3000/api/analytics/profit-by-product');
  const productData = await productRes.json();
  const productBreakdown = productData.map(p =>
    `<div class="flex justify-between"><span>${p.product}</span><span>₱${Number(p.profit).toFixed(2)}</span></div>`
  ).join('');
  document.getElementById('product-profit').innerHTML = productBreakdown;
}


window.addEventListener('DOMContentLoaded', () => {
  loadSalesChart();
});

document.getElementById('exportCSV').addEventListener('click', () => {
  window.location.href = 'http://localhost:3000/api/sales/export';
});

// ========== GLOBAL VARIABLES ==========
let currentRestockProduct = null;

// ========== MODAL ELEMENTS ==========
const historyModal = document.getElementById('history-modal');
const historyContent = document.getElementById('history-content');
const historyTitle = document.getElementById('history-title');
document.getElementById('close-history').onclick = () => historyModal.classList.add('hidden');

const restockModal = document.getElementById('restock-modal');
const restockTitle = document.getElementById('restock-title');
const restockForm = document.getElementById('restock-form');
const restockQuantity = document.getElementById('restock-quantity');
document.getElementById('close-restock').onclick = closeRestockModal;
document.getElementById('close-restock-x').onclick = closeRestockModal;

function closeRestockModal() {
  restockModal.classList.add('hidden');
  currentRestockProduct = null;
  restockQuantity.value = '';
}

// ========== OPEN RESTOCK MODAL ==========
function openRestockModal(product) {
  currentRestockProduct = product;
  restockTitle.textContent = `Restock "${product.name}"`;
  document.getElementById('restock-product-id').value = product.id;
  restockModal.classList.remove('hidden');
}

// ========== RESTOCK FORM SUBMIT ==========
restockForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const quantity = parseInt(restockQuantity.value);
  if (!currentRestockProduct || quantity < 1) return;

  const res = await fetch(`http://localhost:3000/api/products/${currentRestockProduct.id}/restock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity
    })
  });

  if (res.ok) {
    closeRestockModal();
    loadProducts(); // refresh product list
  } else {
    alert('Failed to restock product.');
  }
});

function openSalesHistory(productId) {
  const modal = document.getElementById('history-modal');
  const content = document.getElementById('history-content');
  const title = document.getElementById('history-title');

  if (!modal || !content || !title) {
    alert("Missing modal elements.");
    return;
  }

  // Show the modal
  modal.classList.remove('hidden');
  content.innerHTML = `<p>Loading...</p>`;

  fetch(`http://localhost:3000/api/sales/history/${productId}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    })
    .then(data => {
      if (data.length === 0) {
        content.innerHTML = `<p class="text-gray-500">No sales history for this product.</p>`;
        return;
      }

      content.innerHTML = data.map(sale => `
          <div class="border-b py-2">
            <strong>${sale.quantity}</strong> sold on 
            <span>${new Date(sale.date_sold).toLocaleDateString()}</span> via 
            <em>${sale.platform}</em>
          </div>
        `).join('');
    })
    .catch(err => {
      console.error(err);
      content.innerHTML = `<p class="text-red-500">Error loading history.</p>`;
    });
}

async function loadTotalProfit() {
  try {
    const res = await fetch('http://localhost:3000/api/analytics/total-profit');
    const data = await res.json();

    const profitEl = document.getElementById('total-profit');
    profitEl.textContent = `₱${parseFloat(data.total_profit).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
  } catch (err) {
    console.error('Error loading total profit:', err);
  }
}

let salesChartInstance = null; // store chart instance to destroy & refresh

async function loadSalesChart(type = 'platform') {
  const url = type === 'product' ?
    'http://localhost:3000/api/analytics/sales-by-product' :
    'http://localhost:3000/api/analytics/sales-overview';

  const res = await fetch(url);
  const data = await res.json();

  const labels = type === 'product' ? data.map(d => d.product) : data.map(d => d.platform);
  const values = data.map(d => d.total_sold);

  const ctx = document.getElementById('salesChart').getContext('2d');

  if (salesChartInstance) {
    salesChartInstance.destroy(); // avoid overlaying charts
  }

  salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: type === 'product' ? 'Units Sold (Product)' : 'Units Sold (Platform)',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: type === 'product' ? 'Sales by Product' : 'Sales by Platform'
        }
      }
    }
  });
}

async function loadSummaryStats() {
  try {
    const res = await fetch('http://localhost:3000/api/analytics/summary');
    const data = await res.json();

    document.getElementById('total-products').textContent = data.total_products;
    document.getElementById('total-sales').textContent = `₱${data.total_sales.toLocaleString()}`;
    document.getElementById('total-profit').textContent = `₱${data.total_profit.toLocaleString()}`;
    document.getElementById('low-stock').textContent = data.low_stock_count;
  } catch (err) {
    console.error('Error loading summary stats:', err);
  }
}

document.getElementById('tab-add-product').addEventListener('click', () => {
  document.getElementById('tab-content-product').classList.remove('hidden');
  document.getElementById('tab-content-sale').classList.add('hidden');
  document.getElementById('tab-add-product').classList.add('border-blue-500', 'bg-blue-100');
  document.getElementById('tab-record-sale').classList.remove('border-blue-500', 'bg-blue-100');
});

document.getElementById('tab-record-sale').addEventListener('click', () => {
  document.getElementById('tab-content-sale').classList.remove('hidden');
  document.getElementById('tab-content-product').classList.add('hidden');
  document.getElementById('tab-record-sale').classList.add('border-blue-500', 'bg-blue-100');
  document.getElementById('tab-add-product').classList.remove('border-blue-500', 'bg-blue-100');
});