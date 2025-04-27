
// Enhanced admin dashboard script
document.addEventListener('DOMContentLoaded', function() {
  const isLoggedIn = sessionStorage.getItem('isLIn');

  // If not logged in, prompt for login ID and password
  if (isLoggedIn !== 'true') {
    // Prompt for login credentials
    let loginId = prompt('Enter your login ID:');
    let password = prompt('Enter your password:');
    
    // Replace these with actual validation against stored credentials or API
    const validLoginId = 'a'; // Example valid login ID
    const validPassword = 'a'; // Example valid password
    
    // Validate login credentials
    if (loginId === validLoginId && password === validPassword) {
 ;
      sessionStorage.setItem('isLIn', 'true');
      console.log('Login successful');
      // Proceed with page loading
      fetchOrders(); // Assuming this is where the order fetching function is
    } else {
      // If login is invalid
      alert('Invalid login ID or password');
      return;
    }
  } else {
    console.log('Already logged in');
    // If logged in, proceed with fetching orders
    fetchOrders();
  }

  // Setup event listeners
  document.getElementById('coinForm').addEventListener('submit', handleCoinSubmission);
});

// Track current filter for refreshing
let currentFilter = '';

function toggleActive(button) {
  // Remove active class from all buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked button
  button.classList.add('active');
}

async function fetchOrders(filter = '') {
  try {
    // Update current filter
    currentFilter = filter;
    
    // Show loading indicator
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading orders...</td></tr>';
    
    const response = await fetch(`/admin/orders${filter ? `?filter=${filter}` : ''}`);
    const data = await response.json();

    tbody.innerHTML = '';

    if (data.success) {
      // Update order count
      const orderCount = document.getElementById('orderCount');
      if (orderCount) {
        orderCount.querySelector('.stat-value').textContent = data.orders.length;
      }
      
      if (data.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-orders">No orders found</td></tr>`;
        return;
      }

      data.orders.forEach(order => {
        const statusClass = getStatusClass(order.status);
        const paymentClass = getPaymentClass(order.paymentStatus);
        
        const formattedDate = new Date(order.orderDate).toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        
        const row = `
          <tr>
            <td>${order.orderNumber}</td>
            <td>${order.userId.name}<br><small>${order.userId.email}</small></td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td><span class="payment-badge ${paymentClass}">${order.paymentStatus}</span></td>
            <td>₹${order.total.toFixed(2)}</td>
            <td>
              <button class="btn view-btn" data-id="${order._id}">View Details</button>
            </td>
          </tr>
        `;
        tbody.innerHTML += row;
      });

      // Add event listeners to the view buttons
      document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', () => {
          const orderId = button.getAttribute('data-id');
          fetchOrderDetails(orderId);
        });
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    document.querySelector('#ordersTable tbody').innerHTML = 
      `<tr><td colspan="6" class="error">Error loading orders. Please try again.</td></tr>`;
  }
}

function getStatusClass(status) {
  const statusMap = {
    'Placed': 'status-new',
    'Processing': 'status-processing',
    'Ready': 'status-ready',
    'Out for Delivery': 'status-out',
    'Delivered': 'status-delivered',
    'Cancelled': 'status-cancelled'
  };
  return statusMap[status] || 'status-default';
}

function getPaymentClass(paymentStatus) {
  const paymentMap = {
    'Pending': 'payment-pending',
    'Paid': 'payment-paid',
    'Failed': 'payment-failed'
  };
  return paymentMap[paymentStatus] || 'payment-default';
}

async function fetchOrderDetails(orderId) {
  try {
    const response = await fetch(`/admin/orders/${orderId}`);
    const data = await response.json();

    if (data.success) {
      showOrderDetailsModal(data.order);
    } else {
      showErrorNotification(data.error || 'Failed to load order details');
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    showErrorNotification('Network error. Please try again.');
  }
}

function showOrderDetailsModal(order) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('orderDetailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'orderDetailsModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  // Format dates
  const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  const estimatedDelivery = order.estimatedDelivery ? 
    new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    }) : 'Not set';

  // Create items HTML
  const itemsHtml = order.items.map(item => `
    <div class="order-item">
      <div class="item-header">
        <h4>${item.serviceName} (${item.serviceType})</h4>
        <div class="item-price">₹${item.price.toFixed(2)} × ${item.quantity}</div>
      </div>
      <div class="item-details">
        ${item.design ? `<div><strong>Design:</strong> ${item.design}</div>` : ''}
        ${item.lining ? `<div><strong>Lining:</strong> ${item.lining}</div>` : ''}
        ${item.measurement ? `<div><strong>Measurement:</strong> ${item.measurement}</div>` : ''}
        ${item.referenceImage ? `<div class="ref-image"><strong>Reference Image:</strong> <img src="${item.referenceImage}" alt="Reference"></div>` : ''}
      </div>
    </div>
  `).join('');

  // Create status updates HTML
  const statusUpdatesHtml = order.statusUpdates.map(update => {
    const updateDate = new Date(update.timestamp).toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    return `
      <div class="status-update">
        <div class="status-dot ${getStatusClass(update.status)}"></div>
        <div class="status-info">
          <div class="status-text">${update.status}</div>
          <div class="status-time">${updateDate}</div>
        </div>
      </div>
    `;
  }).join('');

  // Create address HTML
  const address = order.deliveryAddress;
  const addressHtml = `
    <div class="address-box">
      <div class="address-type">${address.type}</div>
      <div class="address-details">
        ${address.street}, ${address.city},<br>
        ${address.state} - ${address.pincode}
      </div>
    </div>
  `;

  // Populate modal content
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Order Details: ${order.orderNumber}</h2>
        <button class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="order-sections">
          <div class="order-section order-info">
            <h3>Order Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Customer</span>
                <span class="info-value">${order.userId.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Contact</span>
                <span class="info-value">${order.userId.email}<br>${order.userId.phone || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Order Date</span>
                <span class="info-value">${orderDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Est. Delivery</span>
                <span class="info-value">${estimatedDelivery}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${order.paymentMethod}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Status</span>
                <span class="info-value payment-badge ${getPaymentClass(order.paymentStatus)}">${order.paymentStatus}</span>
              </div>
            </div>
          </div>

          <div class="order-section order-items">
            <h3>Order Items</h3>
            <div class="items-container">
              ${itemsHtml}
            </div>
          </div>

          <div class="order-sections-grid">
            <div class="order-section order-address">
              <h3>Delivery Address</h3>
              ${addressHtml}
            </div>
            
            <div class="order-section order-status">
              <h3>Status History</h3>
              <div class="status-timeline">
                ${statusUpdatesHtml}
              </div>
            </div>
          </div>

          <div class="order-section order-totals">
            <h3>Order Summary</h3>
            <div class="totals-grid">
              <div class="total-row">
                <span>Subtotal</span>
                <span>₹${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Delivery Charge</span>
                <span>₹${order.deliveryCharge.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Discount</span>
                <span>-₹${order.discount.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total</span>
                <span>₹${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-actions">
          <h3>Update Status</h3>
          <div class="status-update-controls">
            <select id="statusSelect" class="status-select">
              <option value="Placed">Placed</option>
              <option value="Processing">Processing</option>
              <option value="Ready">Ready</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button id="updateStatusBtn" class="btn update-btn" data-id="${order._id}">Update Status</button>
          </div>
          <div class="payment-update-controls">
            <select id="paymentStatusSelect" class="payment-select">
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
            <button id="updatePaymentBtn" class="btn update-payment-btn" data-id="${order._id}">Update Payment</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set current status in dropdowns
  setTimeout(() => {
    const statusSelect = document.getElementById('statusSelect');
    const paymentStatusSelect = document.getElementById('paymentStatusSelect');
    
    if (statusSelect) statusSelect.value = order.status;
    if (paymentStatusSelect) paymentStatusSelect.value = order.paymentStatus;
  }, 0);

  // Show the modal
  modal.style.display = 'block';

  // Add event listeners
  const closeBtn = modal.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Add event listeners for update buttons
  const updateStatusBtn = document.getElementById('updateStatusBtn');
  if (updateStatusBtn) {
    updateStatusBtn.addEventListener('click', () => {
      const newStatus = document.getElementById('statusSelect').value;
      updateOrderStatus(order._id, newStatus);
    });
  }

  const updatePaymentBtn = document.getElementById('updatePaymentBtn');
  if (updatePaymentBtn) {
    updatePaymentBtn.addEventListener('click', () => {
      const newPaymentStatus = document.getElementById('paymentStatusSelect').value;
      updatePaymentStatus(order._id, newPaymentStatus);
    });
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccessNotification(`Status updated to ${newStatus}`);
      // Refresh the orders list with current filter
      fetchOrders(currentFilter);
      // Close the modal
      document.getElementById('orderDetailsModal').style.display = 'none';
    } else {
      showErrorNotification(data.error || 'Failed to update status');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    showErrorNotification('Network error. Please try again.');
  }
}

async function updatePaymentStatus(orderId, newPaymentStatus) {
  try {
    const response = await fetch(`/admin/orders/${orderId}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: newPaymentStatus })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccessNotification(`Payment status updated to ${newPaymentStatus}`);
      // Refresh the orders list with current filter
      fetchOrders(currentFilter);
      // Close the modal
      document.getElementById('orderDetailsModal').style.display = 'none';
    } else {
      showErrorNotification(data.error || 'Failed to update payment status');
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    showErrorNotification('Network error. Please try again.');
  }
}

async function handleCoinSubmission(e) {
  e.preventDefault();

  const emailOrPhone = document.getElementById('emailOrPhone').value.trim();
  const coins = document.getElementById('coins').value;
  const resultDiv = document.getElementById('coinResult');
  
  if (!emailOrPhone || !coins) {
    resultDiv.innerHTML = '<div class="error-message">Please enter both email/phone and coin amount</div>';
    return;
  }

  try {
    resultDiv.innerHTML = '<div class="loading">Processing...</div>';
    
    const response = await fetch('/admin/give-coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, coins })
    });

    const data = await response.json();
    
    if (data.success) {
      resultDiv.innerHTML = `<div class="success-message">${data.message}</div>`;
      // Clear the form
      document.getElementById('emailOrPhone').value = '';
      document.getElementById('coins').value = '';
    } else {
      resultDiv.innerHTML = `<div class="error-message">${data.error || 'Failed to add coins'}</div>`;
    }
  } catch (error) {
    console.error('Error giving coins:', error);
    resultDiv.innerHTML = '<div class="error-message">Network error. Please try again.</div>';
  }
}

function showSuccessNotification(message) {
  showNotification(message, 'success-notification');
}

function showErrorNotification(message) {
  showNotification(message, 'error-notification');
}

function showNotification(message, className) {
  // Remove any existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${className}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide and remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
