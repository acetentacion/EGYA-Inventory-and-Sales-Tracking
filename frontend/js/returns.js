async function loadReturns() {
    const res = await fetch(`${API_BASE}/returns`);
    const returns = await res.json();
    const container = document.getElementById('returns');
    container.innerHTML = returns.map(r => `
      <div class="p-2 border-b flex justify-between">
        <span>${r.product_name} (${r.quantity}) - ${r.reason} - ${r.status}</span>
        ${r.status === 'Pending' ? `<button onclick="approveReturn(${r.id})" class="bg-green-500 text-white px-2 py-1 rounded">Approve</button>` : ''}
      </div>
    `).join('');
  }
  
  async function approveReturn(id) {
    await fetch(`${API_BASE}/returns/${id}/approve`, { method: 'POST' });
    loadReturns();
  }
  
  document.getElementById('return-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sale_id = document.getElementById('sale_id').value;
    const quantity = document.getElementById('return_quantity').value;
    const reason = document.getElementById('return_reason').value;
    
    await fetch(`${API_BASE}/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sale_id, product_id: 1, quantity, reason }) // 🔹 product_id should match sale
    });
    loadReturns();
  });
  
  document.addEventListener('DOMContentLoaded', loadReturns);
  