
const modal = document.getElementById("orderModal");
document.addEventListener("DOMContentLoaded", function () {
  // Fetch orders from the server
  fetchOrders();

  // Close modal when clicking on X
  document.querySelector(".close").addEventListener("click", function () {
    document.getElementById("orderModal").style.display = "none";
  });

  // Close modal when clicking outside of it
  window.addEventListener("click", function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
});

// Function to fetch orders from server
function fetchOrders() {
  fetch("/orders")
    .then((response) => response.json())
    .then((data) => {
      if (data.orders && data.orders.length > 0) {
        // We have orders, render them
        renderOrders(data.orders);

        // Show orders list and hide empty state
        document.querySelector(".orders-list").style.display = "block";
        document.querySelector(".orders-empty").style.display = "none";
      } else {
        // Empty orders
        document.querySelector(".orders-list").style.display = "none";
        document.querySelector(".orders-empty").style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error fetching orders:", error);
      // Show empty state
      document.querySelector(".orders-list").style.display = "none";
      document.querySelector(".orders-empty").style.display = "block";
    });
}

// Function to render orders
function renderOrders(orders) {
  const ordersListContainer = document.getElementById("ordersList");
  ordersListContainer.innerHTML = ""; // Clear existing orders

  const template = document.getElementById("orderCardTemplate");
  const itemTemplate = document.getElementById("orderItemTemplate");

  // Sort orders by date (newest first)
  orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  orders.forEach((order) => {
    const clone = document.importNode(template.content, true);

    // Set order header data
    clone.querySelector(
      ".order-number"
    ).textContent = `Order #${order.orderNumber}`;
    clone.querySelector(".order-date").textContent = formatDate(
      order.orderDate
    );

    // Set status
    const statusElement = clone.querySelector(".order-status");
    statusElement.textContent = order.status;

    // Add appropriate class based on status
    if (order.status === "Placed") {
      statusElement.classList.add("pending");
    } else if (order.status === "Delivered") {
      statusElement.classList.add("delivered");
    } else if (order.status === "Cancelled") {
      statusElement.classList.add("canceled");
    }

    // Set payment badge
    const paymentBadge = clone.querySelector(".payment-badge");
    paymentBadge.textContent = order.paymentStatus;
    if (order.paymentStatus === "Pending") {
      paymentBadge.classList.add("pending");
    }

    // Populate order items
    const orderItemsContainer = clone.querySelector(".order-items");

    order.items.forEach((item) => {
      const itemClone = document.importNode(itemTemplate.content, true);

      itemClone.querySelector(".item-title").textContent = item.serviceType;
      itemClone.querySelector(
        ".item-quantity"
      ).textContent = `Quantity: ${item.quantity}`;
      itemClone.querySelector(".item-price").textContent = `₹${item.price}`;

      orderItemsContainer.appendChild(itemClone);
    });

    // Set order total
    clone.querySelector(".order-total").textContent = `Total: ₹${order.total}`;

    // Add event listener for view details
    const detailsLink = clone.querySelector(".order-details");
    detailsLink.addEventListener("click", function (e) {
      e.preventDefault();
      modal.style.display = "block";
      showOrderDetails(order);
    });

    ordersListContainer.appendChild(clone);
  });
}

// Function to format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-IN", options);
}



// Function to show order details in modal
function showOrderDetails(order) {
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = "";
  // Create order header
  const header = document.createElement("div");
  header.innerHTML = `
          <h3>Order #${order.orderNumber}</h3>
          <p>Placed on ${formatDate(order.orderDate)}</p>
        `;
  modalContent.appendChild(header);

  // Create tracking steps
  const trackingSteps = document.createElement("div");
  trackingSteps.className = "tracking-steps";

  // Define steps
  const steps = [
    { name: "Placed", icon: "fa-check" },
    { name: "Tailoring", icon: "fa-cog" },
    { name: "Dispatched", icon: "fa-truck" },
    { name: "Delivered", icon: "fa-home" },
  ];

  // Determine current step based on order status
  let currentStepIndex = 0;
  if (order.status === "tailoring") currentStepIndex = 1;
  if (order.status === "Dispatched") currentStepIndex = 2;
  if (order.status === "Delivered") currentStepIndex = 3;

  // Create steps
  steps.forEach((step, index) => {
    const stepEl = document.createElement("div");
    stepEl.className = "tracking-step";

    const isActive = index <= currentStepIndex;

    stepEl.innerHTML = `
            <div class="step-icon ${isActive ? "active" : ""}">
              <i class="fas ${step.icon}"></i>
            </div>
            <div class="step-text ${isActive ? "active" : ""}">${
      step.name
    }</div>
          `;

    trackingSteps.appendChild(stepEl);
  });

  modalContent.appendChild(trackingSteps);

  // Create tabs
  const tabs = document.createElement("div");
  tabs.className = "order-tabs";
  tabs.innerHTML = `
          <div class="order-tab active" data-tab="items">Items</div>
          <div class="order-tab" data-tab="shipping">Shipping Info</div>
          <div class="order-tab" data-tab="payment">Payment</div>
        `;
  modalContent.appendChild(tabs);

  // Add event listeners to tabs
  tabs.querySelectorAll(".order-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs
        .querySelectorAll(".order-tab")
        .forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all tab content
      modalContent.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // Show selected tab content
      const tabName = this.getAttribute("data-tab");
      document.getElementById(`${tabName}Tab`).classList.add("active");
    });
  });

  // Create tab contents
  // 1. Items tab
  const itemsTab = document.createElement("div");
  itemsTab.className = "tab-content active";
  itemsTab.id = "itemsTab";

  // Add items to tab
  order.items.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = "order-item";
    itemEl.innerHTML = `
            <div class="item-image">
              <img src="/imgs/WhatsApp Image 2025-04-09 at 19.41.16_9df32446.jpg" alt="Service image" />
            </div>
            <div class="item-details">
              <div class="item-title">${item.serviceType}</div>
              <div class="item-options">Quantity: ${item.quantity}</div>
            </div>
            <div class="item-price">₹${item.price}</div>
          `;
    itemsTab.appendChild(itemEl);
  });

  // Add order summary
  const summary = document.createElement("div");
  summary.className = "order-summary";
  summary.innerHTML = `
          <div style="width: 100%; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Subtotal</span>
              <span>₹${order.subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Delivery Charges</span>
              <span>₹${order.deliveryCharge}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Discount</span>
              <span>₹${order.discount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 600; margin-top: 10px;">
              <span>Total</span>
              <span>₹${order.total}</span>
            </div>
          </div>
        `;
  itemsTab.appendChild(summary);

  modalContent.appendChild(itemsTab);

  // 2. Shipping tab
  const shippingTab = document.createElement("div");
  shippingTab.className = "tab-content";
  shippingTab.id = "shippingTab";

  shippingTab.innerHTML = `
          <div class="delivery-address">
            <div class="address-label">${
              order.deliveryAddress.type
            } Address:</div>
            <div>${order.deliveryAddress.street}</div>
            <div>${order.deliveryAddress.city}, ${
    order.deliveryAddress.state
  } - ${order.deliveryAddress.pincode}</div>
          </div>
          
          <div class="delivery-estimate">
            <div>Estimated Delivery:</div>
            <div class="delivery-date">${formatDate(
              order.estimatedDelivery
            )}</div>
          </div>
          
          <div class="order-actions" style="margin-top: 20px;">
            <button class="btn btn-outline">Track Order</button>
          </div>
        `;

  modalContent.appendChild(shippingTab);

  // 3. Payment tab
  const paymentTab = document.createElement("div");
  paymentTab.className = "tab-content";
  paymentTab.id = "paymentTab";

  paymentTab.innerHTML = `
          <div style="margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 5px;">Payment Method:</div>
            <div>${order.paymentMethod}</div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 5px;">Payment Status:</div>
            <div>${order.paymentStatus}</div>
          </div>
          
         
          
          

        `;
  modalContent.appendChild(paymentTab);
}

// Function to initiate payment process
function makePayment(orderNumber) {
  // Redirect to payment page with order number
  window.location.href = `/payment/${orderNumber}`;
}
