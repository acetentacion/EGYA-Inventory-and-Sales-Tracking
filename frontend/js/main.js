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
      const div = document.createElement('div');
      div.className = 'p-4 bg-white rounded shadow mb-2';
      div.innerHTML = `
        <strong>${product.name}</strong> (${product.sku}) - Stock: ${product.current_stock}
        <br>
        <button onclick="editProduct(${product.id})" class="bg-yellow-500 text-white px-2 py-1 rounded mr-2 mt-2">Edit</button>
        <button onclick="deleteProduct(${product.id})" class="bg-red-600 text-white px-2 py-1 rounded mt-2">Delete</button>
      `;
      productList.appendChild(div);
    });
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

      
    loadSales();
    populateCategoryDropdown();


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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
  