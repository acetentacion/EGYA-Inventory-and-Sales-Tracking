// 📦 Products Page Script
// const API_BASE = 'http://localhost:3000/api';

// ================= Restock Tracking =================
//var currentRestockProduct = window.currentRestockProduct || null;


// ================= Fetch & Render Products =================
async function loadProducts(search = '', category = '') {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();

    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                            product.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || product.category === category;
      return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);

    // Highlight if coming from dashboard
    const highlightId = new URLSearchParams(window.location.search).get('highlightId');
    if (highlightId) {
      const targetCard = document.querySelector(`[data-product-id="${highlightId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('ring-4', 'ring-yellow-400', 'animate-pulse'); 
        // 🔹 No timeout — stays highlighted until page reload or user action
      }
    }
    
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function renderProducts(products) {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';

  products.forEach(product => {
    let stockColor = 'bg-green-100 text-green-800';
    if (product.current_stock <= 5) stockColor = 'bg-red-100 text-red-800';
    else if (product.current_stock <= 15) stockColor = 'bg-yellow-100 text-yellow-800';

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between';
    card.setAttribute('data-product-id', product.id);
    card.innerHTML = `
      <div>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">${product.name}</h3>
          <span class="text-xs px-2 py-1 rounded ${stockColor}">${product.current_stock} in stock</span>
        </div>
        <p class="text-sm text-gray-500 mt-1">SKU: ${product.sku}</p>
        <p class="text-sm text-gray-500">Category: ${product.category}</p>
      </div>
      <div class="flex gap-2 mt-3">
        <button onclick='openRestockModal(${JSON.stringify(product)})' class="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-sm">Restock</button>
        <button onclick="editProduct(${product.id})" class="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded text-sm">Edit</button>
        <button onclick="deleteProduct(${product.id})" class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-sm">Delete</button>
        <button onclick="openSalesHistory(${product.id}, '${product.name.replace(/'/g, "\\'")}')" class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-sm">History</button>
      </div>
    `;
    productList.appendChild(card);
  });
}

// ================= Save Product =================
async function saveProduct(e) {
  e.preventDefault();
  const product = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    cost_price: parseFloat(document.getElementById('cost_price').value),
    sell_price: parseFloat(document.getElementById('sell_price').value),
    current_stock: parseInt(document.getElementById('current_stock').value)
  };

  const id = document.getElementById('product_id').value;
  const method = id ? 'PUT' : 'POST';
  const url = `${API_BASE}/products${id ? '/' + id : ''}`;

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Error saving product:", err);
    alert(err.error || "Failed to save product");
    return;
  }

  closeProductModal();
  loadProducts();
}


// ================= Delete Product =================
let productToDelete = null;

function deleteProduct(id) {
  productToDelete = id;
  document.getElementById('delete-message').textContent =
    'Are you sure you want to delete this product?';
  document.getElementById('delete-modal').classList.remove('hidden');
}

async function confirmDelete() {
  if (!productToDelete) return;
  
  await fetch(`${API_BASE}/products/${productToDelete}`, { method: 'DELETE' });
  closeDeleteModal();
  loadProducts();
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  productToDelete = null;
}

// ✅ Attach after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cancel-delete')?.addEventListener('click', closeDeleteModal);
  document.getElementById('close-delete-x')?.addEventListener('click', closeDeleteModal);
  document.getElementById('confirm-delete')?.addEventListener('click', confirmDelete);
});



// ================= Edit Product =================
async function editProduct(id) {
  const res = await fetch(`${API_BASE}/products`);
  const products = await res.json();
  const product = products.find(p => p.id === id);
  
  if (product) {
    document.getElementById('name').value = product.name;
    document.getElementById('sku').value = product.sku;
    document.getElementById('category').value = product.category;
    document.getElementById('cost_price').value = product.cost_price;
    document.getElementById('sell_price').value = product.sell_price;
    document.getElementById('current_stock').value = product.current_stock;
    document.getElementById('product_id').value = product.id;
    
    openProductModal(true);
  }
}

// ================= Restock =================
// ================= Restock =================
// Use let instead of var to avoid redeclaration conflicts
let currentRestockProduct = null;

function openRestockModal(product) {
  currentRestockProduct = product;
  document.getElementById('restock-product-id').value = product.id;
  document.getElementById('restock-title').textContent = `Restock ${product.name}`;
  document.getElementById('restock-modal').classList.remove('hidden');
}

function closeRestockModal() {
  document.getElementById('restock-modal').classList.add('hidden');
  currentRestockProduct = null;
}

// Attach listeners after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const closeRestockBtn = document.getElementById('close-restock');
  const closeRestockX = document.getElementById('close-restock-x');
  const restockForm = document.getElementById('restock-form');

  closeRestockBtn?.addEventListener('click', closeRestockModal);
  closeRestockX?.addEventListener('click', closeRestockModal);

  restockForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const quantity = parseInt(document.getElementById('restock-quantity').value);
    if (!currentRestockProduct) return;
    
    await fetch(`${API_BASE}/products/${currentRestockProduct.id}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    closeRestockModal();
    loadProducts();
  });
});


function closeRestockModal() {
  document.getElementById('restock-modal').classList.add('hidden');
}

document.getElementById('close-restock')?.addEventListener('click', closeRestockModal);
document.getElementById('close-restock-x')?.addEventListener('click', closeRestockModal);

// ================= History =================
function openSalesHistory(productId, productName) {
  document.getElementById('history-title').textContent = `Sales History for ${productName}`;
  document.getElementById('history-content').innerHTML = 'Loading...';
  document.getElementById('history-modal').classList.remove('hidden');

  fetch(`${API_BASE}/sales/history/${productId}`)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        document.getElementById('history-content').innerHTML = '<p class="text-gray-500">No sales recorded.</p>';
      } else {
        document.getElementById('history-content').innerHTML = data.map(sale => `
          <div class="border-b py-2">
            <p><strong>${sale.quantity}</strong> sold via ${sale.platform}</p>
            <p class="text-xs text-gray-500">${new Date(sale.date_sold).toLocaleString()}</p>
          </div>
        `).join('');
      }
    })
    .catch(() => {
      document.getElementById('history-content').innerHTML = '<p class="text-red-500">Error loading history.</p>';
    });
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('close-history')?.addEventListener('click', closeHistoryModal);
});


// ================= Category Dropdown =================
async function populateCategoryDropdown() {
  try {
    const res = await fetch(`${API_BASE}/products/categories`);
    const categories = await res.json();
    
    const dropdown = document.getElementById('category-filter');
    dropdown.innerHTML = `<option value="">All Categories</option>`;
    
    categories.forEach(category => {
      const opt = document.createElement('option');
      opt.value = category;
      opt.textContent = category;
      dropdown.appendChild(opt);
    });

  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// ================= Init =================
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  populateCategoryDropdown();
  document.getElementById('product-form').addEventListener('submit', saveProduct);
  document.getElementById('product-search')?.addEventListener('input', (e) => {
    loadProducts(e.target.value, document.getElementById('category-filter').value);
  });
  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    loadProducts(document.getElementById('product-search').value, e.target.value);
  });
});

// ================= Product Modal =================
function openProductModal(isEdit = false) {
  const modalTitle = document.getElementById('product-modal-title');
  modalTitle.textContent = isEdit ? 'Edit Product' : 'Add Product';
  
  document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  document.getElementById('product-form').reset();
  document.getElementById('product_id').value = '';
}

// Attach close buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('close-product')?.addEventListener('click', closeProductModal);
  document.getElementById('close-product-x')?.addEventListener('click', closeProductModal);
});

