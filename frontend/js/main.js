async function loadProducts() {
    const response = await fetch('http://localhost:3000/api/products');
    const data = await response.json();
  
    const list = document.getElementById('product-list');
    list.innerHTML = '';
  
    data.forEach(product => {
      const div = document.createElement('div');
      div.className = "p-3 bg-white shadow rounded";
      div.innerHTML = `<strong>${product.name}</strong> (${product.sku}) - Stock: ${product.current_stock}`;
      list.appendChild(div);
    });
  }
  