//const API_BASE = 'http://localhost:3000/api';
let salesChartInstance = null; // store the chart instance


async function loadDashboardSummary() {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary`);
      const data = await res.json();
      console.log("Summary Data:", data);
  
      document.getElementById('total-products').textContent = data.total_products;
      document.getElementById('total-sales').textContent = `₱${data.total_sales}`;
      document.getElementById('total-profit').textContent = `₱${data.total_profit}`;
      document.getElementById('low-stock').textContent = data.low_stock_count;
  
      // Low stock alert
      const alertBox = document.getElementById('low-stock-alert');
      const countSpan = document.getElementById('low-stock-count');
      const listEl = document.getElementById('low-stock-list');
  
      if (data.low_stock_count > 0) {
        countSpan.textContent = data.low_stock_count;
        listEl.innerHTML = data.low_stock_products
          .map(p => `
            <li>
              <a href="products.html?highlightId=${p.id}" 
                class="text-blue-600 hover:underline">
                ${p.name} (${p.current_stock} left)
              </a>
            </li>
          `).join('');

        alertBox.classList.remove('hidden');
      } else {
        alertBox.classList.add('hidden');
      }
  
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  }
  
  

// async function loadSalesChart(type = 'platform') {
//   try {
//     const res = await fetch(`${API_BASE}/analytics/sales-overview?type=${type}`);
//     const data = await res.json();
//     const ctx = document.getElementById('salesChart').getContext('2d');


//     if (salesChartInstance) {
//       salesChartInstance.destroy();
//     }

//     salesChartInstance = new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels: data.map(d => type === 'platform' ? d.platform : d.product_name),
//         datasets: [{
//           label: type === 'platform' ? 'Sales by Platform' : 'Sales by Product',
//           data: data.map(d => d.total_sold),
//           backgroundColor: 'rgba(59, 130, 246, 0.6)'
//         }]
//       },
//       options: {
//         responsive: true,
//         plugins: {
//           legend: { display: false },
//           title: { display: true, text: type === 'platform' ? 'Sales by Platform' : 'Sales by Product' }
//         }
//       }
//     }); 
//   } catch (err) {
//     console.error('Error loading chart:', err);
//   } 
// }

async function loadSalesData(type = 'platform') {
  try {
    const res = await fetch(`${API_BASE}/analytics/sales-overview?type=${type}`);
    const data = await res.json();
    const tableBody = document.getElementById('salesDataTable');

    tableBody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2">${type === 'platform' ? row.platform : row.product_name}</td>
        <td class="p-2">${row.total_sold}</td>
        <td class="p-2">${row.total_returned ?? 0}</td> <!-- ✅ New Returns column -->
      `;
      tableBody.appendChild(tr);
    });

  } catch (err) {
    console.error('Error loading sales data:', err);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  loadSalesData();

  document.getElementById('salesDataType').addEventListener('change', (e) => {
    loadSalesData(e.target.value);
  });
});


document.addEventListener('DOMContentLoaded', () => {
  loadDashboardSummary();
  //loadSalesChart();

  // document.getElementById('salesChartType').addEventListener('change', (e) => {
  //   //loadSalesChart(e.target.value);
  // });
});

async function loadRecentActivity() {
  try {
    const res = await fetch(`${API_BASE}/analytics/recent-activity`);
    const data = await res.json();

    const container = document.getElementById('recent-activity');
    container.innerHTML = '';

    if (!data.length) {
      container.innerHTML = `<li class="text-gray-500">No recent activity.</li>`;
      return;
    }

    data.forEach(log => {
      const li = document.createElement('li');
      li.className = "p-2 border-b flex justify-between items-center";
      li.innerHTML = `
        <span>
          <strong>${log.type}:</strong> ${log.product_name}
          ${log.quantity > 0 ? `(${log.quantity})` : ''}
          <span class="text-xs text-gray-500">- ${log.note}</span>
        </span>
        <span class="text-xs text-gray-400">${new Date(log.date).toLocaleString()}</span>
      `;
      container.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading recent activity:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardSummary();
  loadRecentActivity();
  //loadSalesChart();
  loadBestSellingProducts();
});

async function loadBestSellingProducts() {
  try {
    const res = await fetch(`${API_BASE}/analytics/best-selling`);
    const products = await res.json();

    const listEl = document.getElementById('best-selling-list');
    if (!listEl) {
      console.error("Element #best-selling-list not found in HTML");
      return;
    }

    listEl.innerHTML = '';

    if (!products.length) {
      listEl.innerHTML = '<li>No sales yet</li>';
      return;
    }

    products.forEach(p => {
      listEl.innerHTML += `
        <li>
          <a href="products.html?highlightId=${p.id}" 
             class="text-blue-600 hover:underline">
            ${p.name} — ${p.total_sold} units sold
          </a>
        </li>
      `;
    });

  } catch (err) {
    console.error('Error fetching best selling product:', err);
  }
}

async function loadProductMovement() {
  try {
    const res = await fetch(`${API_BASE}/analytics/movement-status`);
    const data = await res.json();

    const fastList = document.getElementById('fast-moving-list');
    const slowList = document.getElementById('slow-moving-list');

    fastList.innerHTML = data.fastMoving.length
      ? data.fastMoving.map(p => `<li>${p.name} (${p.total_sold_last_30_days} sold)</li>`).join('')
      : '<li class="text-gray-500">No fast-moving products</li>';

    slowList.innerHTML = data.slowMoving.length
      ? data.slowMoving.map(p => `<li>${p.name} (${p.total_sold_last_30_days || 0} sold)</li>`).join('')
      : '<li class="text-gray-500">No slow-moving products</li>';

  } catch (err) {
    console.error('Error fetching movement status:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProductMovement();
});
