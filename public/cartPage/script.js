document.addEventListener("DOMContentLoaded", function () {
  // Fetch cart items
  fetchCartItems();

  // Fetch user addresses
  fetchUserAddresses();

  // Event listeners for address buttons
  document
    .getElementById("btnShowAddAddress")
    ?.addEventListener("click", showAddressForm);
  document
    .getElementById("btnAddFirstAddress")
    ?.addEventListener("click", showAddressForm);
  document
    .getElementById("cancelAddressBtn")
    ?.addEventListener("click", hideAddressForm);

  // Event listener for address form
  document
    .getElementById("addAddressForm")
    ?.addEventListener("submit", function (e) {
      e.preventDefault();
      addNewAddress();
    });

  // Add event listeners for payment options
  const paymentOptions = document.querySelectorAll(".payment-option");
  paymentOptions.forEach((option) => {
    option.addEventListener("click", function () {
      paymentOptions.forEach((o) => o.classList.remove("selected"));
      this.classList.add("selected");
    });
  });
  
  // Continue Shopping button
  document
    .getElementById("btnContinueShopping")
    ?.addEventListener("click", function () {
      window.location.href = "/"; // Navigate to services page
    });

  // Checkout button
  document
    .getElementById("btnCheckout")
    ?.addEventListener("click", function () {
      // Validate and process checkout
      processCheckout();
    });

  // Add coins checkbox event listener
  const coinsCheckbox = document.getElementById("useCoinsCheckbox");
  if (coinsCheckbox) {
    coinsCheckbox.addEventListener("change", function () {
      updateCartWithCoins();
    });
  }
});

// Function to hide the address form
function hideAddressForm() {
  document.getElementById("addressFormContainer").style.display = "none";
  document.querySelector('.overlay').style.display = 'none';
}

// Function to show the address form
function showAddressForm() {
  // Create overlay
  let overlay = document.querySelector('.overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
  }
  
  // Show overlay and form
  overlay.style.display = 'block';
  document.getElementById("addressFormContainer").style.display = "block";
}

// Function to fetch cart items from server
function fetchCartItems() {
  fetch("/api/cart")
    .then((response) => response.json())
    .then((data) => {
      if (data.cart && data.cart.items && data.cart.items.length > 0) {
        // We have items, render them
        console.log("data:", data.cart);
        renderCartItems(data.cart.items);
        updateCartSummary(data.cart);

        // Show cart items and hide empty state
        document.querySelector(".cart-items").style.display = "block";
        document.querySelector(".cart-empty").style.display = "none";
      } else {
        // Empty cart
        document.querySelector(".cart-items").style.display = "none";
        document.querySelector(".cart-empty").style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error fetching cart items:", error);
      // For demo purposes, render sample data
      renderSampleData();
    });
}

// Function to render cart items
function renderCartItems(items) {
  const cartItemsContainer = document.getElementById("cartItems");
  cartItemsContainer.innerHTML = ""; // Clear existing items

  const template = document.getElementById("cartItemTemplate");

  items.forEach((item) => {
    const clone = document.importNode(template.content, true);
    console.log(item);
    // Set item data
    clone.querySelector(".item-image img").src =
      item.image || "/imgs/WhatsApp Image 2025-04-09 at 19.41.16_9df32446.jpg";
    clone.querySelector(".item-title").textContent = item.serviceType;

    // Build options HTML
    let optionsHtml = "";
    if (item.lining) optionsHtml += `<div>Lining: ${item.lining}</div>`;
    if (item.design) optionsHtml += `<div>Design: ${item.design}</div>`;
    if (item.measurement)
      optionsHtml += `<div>Measurement: ${item.measurement}</div>`;

    clone.querySelector(".item-options").innerHTML = optionsHtml;
    clone.querySelector(".item-price").textContent = `₹${item.totalPrice}`;
    clone.querySelector(".quantity").textContent = item.quantity || 1;

    // Add event listeners
    const removeBtn = clone.querySelector(".item-remove");
    removeBtn.addEventListener("click", () => removeCartItem(item._id));

    const plusBtn = clone.querySelector(".quantity-btn.plus");
    plusBtn.addEventListener("click", () => updateQuantity(item._id, 1));

    const minusBtn = clone.querySelector(".quantity-btn.minus");
    minusBtn.addEventListener("click", () => updateQuantity(item._id, -1));

    cartItemsContainer.appendChild(clone);
  });
}

// Function to update cart summary (now accepts an optional deliveryCharge parameter)
function updateCartSummary(cart, deliveryCharge) {
  document.getElementById("subtotal").textContent = `₹${cart.subtotal || 0}`;
  
  // Use provided delivery charge or default from cart
  const finalDeliveryCharge = deliveryCharge !== undefined ? deliveryCharge : (cart.deliveryCharge || 0);
  document.getElementById("deliveryCharge").textContent = `₹${finalDeliveryCharge}`;
  
  // Store original discount in a hidden field and visible field
  const discountValue = cart.discount || 0;
  document.getElementById("discount").textContent = `₹${discountValue}`;
  
  // Make sure the originalDiscount element exists
  const originalDiscountElement = document.getElementById("originalDiscount");
  if (originalDiscountElement) {
    originalDiscountElement.textContent = `₹${discountValue}`;
  } else {
    // Create a hidden element to store original discount if it doesn't exist
    const hiddenElement = document.createElement("span");
    hiddenElement.id = "originalDiscount";
    hiddenElement.style.display = "none";
    hiddenElement.textContent = `₹${discountValue}`;
    document.body.appendChild(hiddenElement);
  }

  // Calculate new total with potential custom delivery charge
  const total = (cart.subtotal || 0) + finalDeliveryCharge - discountValue;
  document.getElementById("totalAmount").textContent = `₹${Math.max(0, total)}`;

  // Reset coin checkbox when updating cart
  const useCoinsCheckbox = document.getElementById("useCoinsCheckbox");
  if (useCoinsCheckbox) {
    useCoinsCheckbox.checked = false;
  }

  // Update coin value display
  const coinValueElement = document.getElementById("coinValue");
  if (coinValueElement) {
    coinValueElement.textContent = "₹0";
  }

  // Update cart badge
  const cartBadge = document.querySelector(".cart-badge");
  if (cartBadge) {
    const totalItems = cart.items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    cartBadge.textContent = totalItems;
  }
}

// Function to remove item from cart
function removeCartItem(itemId) {
  fetch(`/api/cart/item/${itemId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        fetchCartItems(); // Refresh cart
      } else {
        alertBox("Failed to remove item from cart", "error", 3000);
      }
    })
    .catch((error) => {
      console.error("Error removing item:", error);
    });
}

// Function to update item quantity
function updateQuantity(itemId, change) {
  fetch(`/api/cart/item/${itemId}/quantity`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ change }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        fetchCartItems(); // Refresh cart
      } else {
        alertBox("Failed to update quantity", "error", 3000);
      }
    })
    .catch((error) => {
      console.error("Error updating quantity:", error);
    });
}

// Function to process checkout
function processCheckout() {
  const selectedAddress = document.querySelector(".address-card.selected");
  const selectedPayment = document.querySelector(".payment-option.selected");
  const useCoinsCheckbox = document.getElementById("useCoinsCheckbox");
  const quickDeliveryToggle = document.getElementById("quickDeliveryToggle");

  if (!selectedAddress) {
    alertBox("Please select a delivery address", "info", 3000);
    return;
  }

  if (!selectedPayment) {
    alertBox("Please select a payment method", "info", 3000);
    return;
  }

  const addressId = selectedAddress.dataset.id;
  const paymentMethod = selectedPayment.querySelector(".payment-name").textContent;
  const useCoins = useCoinsCheckbox ? useCoinsCheckbox.checked : false;
  const quickDelivery = quickDeliveryToggle ? quickDeliveryToggle.checked : false;

  fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addressId,
      paymentMethod,
      useCoins,
      quickDelivery
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = `/order-confirmation/${data.orderId}`;
      } else {
        alertBox("Checkout failed: " + data.message, "error", 3000);
      }
    })
    .catch((error) => {
      console.error("Error during checkout:", error);
      alertBox("An error occurred during checkout", "error", 3000);
    });
}
// Function to render sample data for demonstration
function renderSampleData() {
  const sampleCart = {
    items: [
      {
        _id: "sample1",
        serviceName: "Blouse Stitching",
        lining: "Without Lining",
        design: "Classic",
        measurement: "Provide Measurement Blouse",
        price: 249,
        quantity: 1,
        image: "/imgs/WhatsApp Image 2025-04-09 at 19.41.16_9df32446.jpg",
      },
    ],
    subtotal: 249,
    deliveryCharge: 0,
    discount: 0,
    total: 249,
  };

  renderCartItems(sampleCart.items);
  updateCartSummary(sampleCart);

  document.querySelector(".cart-items").style.display = "block";
  document.querySelector(".cart-empty").style.display = "none";
}

// Function to fetch user addresses
function fetchUserAddresses() {
  fetch('/api/user/addresses')
    .then(response => response.json())
    .then(data => {
      if (data.addresses && data.addresses.length > 0) {
        // We have addresses, render them
        renderAddresses(data.addresses);
        
        // Show addresses container and hide "no addresses" message
        document.getElementById('addressesContainer').style.display = 'block';
        document.getElementById('noAddressesMessage').style.display = 'none';
        
        // Find default address and fetch its delivery charge
        const defaultAddress = data.addresses.find(addr => addr.isDefault) || data.addresses[0];
        if (defaultAddress) {
          fetchDeliveryCharge(defaultAddress._id);
        }
      } else {
        // No addresses
        document.getElementById('addressesContainer').style.display = 'none';
        document.getElementById('noAddressesMessage').style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error fetching addresses:', error);
      // Show no addresses message
      document.getElementById('addressesContainer').style.display = 'none';
      document.getElementById('noAddressesMessage').style.display = 'block';
      
      // For demo/development purposes, you can show sample data instead
      // renderSampleAddresses();
    });
}

// Function to render addresses
function renderAddresses(addresses) {
  const addressesList = document.getElementById('addressesList');
  if (!addressesList) return;
  
  // Clear existing addresses
  addressesList.innerHTML = '';
  
  addresses.forEach(address => {
    const addressCard = document.createElement('div');
    addressCard.className = 'address-card';
    addressCard.dataset.id = address._id;
    
    // If it's the default address, select it automatically
    if (address.isDefault) {
      addressCard.classList.add('selected');
    }
    
    // Include delivery charge in the data attribute (if available)
    if (address.deliveryCharge !== undefined) {
      addressCard.dataset.deliveryCharge = address.deliveryCharge;
    }
    
    addressCard.innerHTML = `
      <div class="address-icon">
        <i class="fas fa-${address.type === 'Home' ? 'home' : address.type === 'Work' ? 'building' : 'map-marker-alt'}"></i>
      </div>
      <div class="address-details">
        <div class="address-type">${address.type}</div>
        <div class="address-line">${address.street}</div>
        <div class="address-line">${address.city}, ${address.state} - ${address.pincode}</div>
        ${address.deliveryCharge !== undefined ? 
          `<div class="delivery-charge">Pickup & Delivery: ₹${address.deliveryCharge}</div>` : ''}
      </div>
    `;
    
    // Add click event listener to select address and update delivery charge
    addressCard.addEventListener('click', function() {
      document.querySelectorAll('.address-card').forEach(card => {
        card.classList.remove('selected');
      });
      this.classList.add('selected');
      
      // Fetch delivery charge for this address
      fetchDeliveryCharge(address._id);
    });
    
    addressesList.appendChild(addressCard);
  });
}

// Function to fetch delivery charge for an address
function fetchDeliveryCharge(addressId) {
  fetch(`/api/user/address/${addressId}/deliveryCharge`)
    .then(response => response.json())
    .then(data => {
      if (data.deliveryCharge !== undefined) {
        // Get the current cart values
        const currentSubtotal = parseFloat(document.getElementById("subtotal").textContent.replace("₹", "")) || 0;
        const currentDiscount = parseFloat(document.getElementById("discount").textContent.replace("₹", "")) || 0;
        
        // Update delivery charge display (use standard by default)
        document.getElementById("deliveryCharge").textContent = `₹${data.deliveryCharge}`;
        
        // Update total
        const total = currentSubtotal + data.deliveryCharge - currentDiscount;
        document.getElementById("totalAmount").textContent = `₹${Math.max(0, total)}`;
        
        // Update selected address card with both delivery charges
        const selectedAddress = document.querySelector('.address-card.selected');
        if (selectedAddress) {
          selectedAddress.dataset.deliveryCharge = data.deliveryCharge;
          selectedAddress.dataset.quickDeliveryCharge = data.quickDeliveryCharge || (data.deliveryCharge + 40);
        }
        
        // If there's a delivery charge display element in the address card, update it
        if (selectedAddress && selectedAddress.querySelector('.delivery-charge')) {
          selectedAddress.querySelector('.delivery-charge').textContent = `Delivery: ₹${data.deliveryCharge}`;
        } else if (selectedAddress) {
          // Add delivery charge display if it doesn't exist
          const deliveryChargeElement = document.createElement('div');
          deliveryChargeElement.className = 'delivery-charge';
          deliveryChargeElement.textContent = `Delivery: ₹${data.deliveryCharge}`;
          selectedAddress.querySelector('.address-details').appendChild(deliveryChargeElement);
        }
        
        // Reset quick delivery toggle when changing address
        const quickDeliveryToggle = document.getElementById("quickDeliveryToggle");
        if (quickDeliveryToggle) {
          quickDeliveryToggle.checked = false;
        }
        
        // Hide quick delivery badge
        const quickBadge = document.getElementById("quickDeliveryBadge");
        if (quickBadge) {
          quickBadge.style.display = "none";
        }
        
        // Reset delivery method text
        const deliveryMethodText = document.getElementById("deliveryMethodText");
        if (deliveryMethodText) {
          deliveryMethodText.textContent = "Standard Delivery (2-3 days)";
        }
      }
    })
    .catch(error => {
      console.error('Error fetching delivery charge:', error);
    });
}


// Function to add new address
function addNewAddress() {
  const type = document.getElementById("addressType").value;
  const street = document.getElementById("addressStreet").value;
  const city = document.getElementById("addressCity").value;
  const state = document.getElementById("addressState").value;
  const pincode = document.getElementById("addressPincode").value;
  const isDefault = document.getElementById("isDefaultAddress").checked;
  
  fetch('/api/user/address', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      street,
      city,
      state,
      pincode,
      isDefault
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Hide form and refresh addresses
      hideAddressForm();
      document.getElementById("addAddressForm").reset();
      
      // Refresh addresses and update delivery charge if this is the default address
      fetchUserAddresses();
      
      // If the new address is default, fetch its delivery charge
      if (isDefault && data.newAddress && data.newAddress._id) {
        fetchDeliveryCharge(data.newAddress._id);
      }
      
      alertBox("Address added successfully", "success", 3000);
    } else {
      alertBox(data.error || 'Failed to add address', "error", 3000);
    }
  })
  .catch(error => {
    console.error('Error adding address:', error);
    alertBox('An error occurred while adding the address', "error", 3000);
  });
}

// Function to update cart totals when using coins
function updateCartWithCoins() {
  const useCoinsCheckbox = document.getElementById("useCoinsCheckbox");
  const userCoins =
    parseInt(document.getElementById("headerCoins").textContent) || 0;
  const coinValueElement = document.getElementById("coinValue");

  // Get current cart values
  const subtotal =
    parseFloat(
      document.getElementById("subtotal").textContent.replace("₹", "")
    ) || 0;
  const deliveryCharge =
    parseFloat(
      document.getElementById("deliveryCharge").textContent.replace("₹", "")
    ) || 0;
  const originalDiscount =
    parseFloat(
      document.getElementById("originalDiscount").textContent.replace("₹", "")
    ) || 0;

  // Calculate totals
  let coinDiscount = 0;
  let totalDiscount = originalDiscount;

  if (useCoinsCheckbox && useCoinsCheckbox.checked) {
    // Each coin is worth ₹1
    coinDiscount = Math.min(userCoins, subtotal); // Can't discount more than the subtotal
    totalDiscount = originalDiscount + coinDiscount;

    if (coinValueElement) {
      coinValueElement.textContent = `₹${coinDiscount}`;
    }
  } else {
    if (coinValueElement) {
      coinValueElement.textContent = "₹0";
    }
  }

  // Update discount display
  document.getElementById("discount").textContent = `₹${totalDiscount}`;

  // Update total amount
  const total = subtotal + deliveryCharge - totalDiscount;
  document.getElementById("totalAmount").textContent = `₹${Math.max(0, total)}`;
}

function alertBox(text, type = "info", duration = 3000) {
  // Remove any existing alert box
  const existingAlert = document.querySelector('.seera-alert-box');
  if (existingAlert) {
    existingAlert.remove();
  }

  // Create alert box container
  const alertBox = document.createElement('div');
  alertBox.className = 'seera-alert-box';
  
  // Determine icon and color based on type
  let icon, backgroundColor, borderColor;
  
  switch(type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      backgroundColor = '#e8f5e9';
      borderColor = '#4caf50';
      break;
    case "error":
      icon = '<i class="fas fa-times-circle"></i>';
      backgroundColor = '#ffebee';
      borderColor = '#e53935';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      backgroundColor = '#fff8e1';
      borderColor = '#ffc107';
      break;
    case "info":
    default:
      icon = '<i class="fas fa-info-circle"></i>';
      backgroundColor = '#e3f2fd';
      borderColor = '#2196f3';
      break;
  }
  
  // Set styles
  alertBox.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${backgroundColor};
    border-left: 4px solid ${borderColor};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 16px;
    z-index: 10000;
    min-width: 280px;
    max-width: 90%;
    display: flex;
    align-items: center;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    animation: slideDown 0.3s ease-out forwards;
  `;
  
  // Create content
  alertBox.innerHTML = `
    <div style="color: ${borderColor}; font-size: 24px; margin-right: 14px;">${icon}</div>
    <div style="flex-grow: 1;">
      <div style="font-size: 14px; color: #333; line-height: 1.4;">${text}</div>
    </div>
    <div class="seera-alert-close" style="cursor: pointer; color: #777; font-size: 18px; margin-left: 10px;">
      <i class="fas fa-times"></i>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(alertBox);
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  // Add close functionality
  const closeBtn = alertBox.querySelector('.seera-alert-close');
  closeBtn.addEventListener('click', () => {
    alertBox.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      alertBox.remove();
    }, 300);
  });
  
  // Auto close if duration is provided
  if (duration > 0) {
    setTimeout(() => {
      if (alertBox.parentNode) {
        alertBox.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
          if (alertBox.parentNode) {
            alertBox.remove();
          }
        }, 300);
      }
    }, duration);
  }
  
  // Return the alert box element in case further manipulation is needed
  return alertBox;
}

// Add this to the end of the DOMContentLoaded event listener in paste-3.txt
// Quick delivery toggle event listener
const quickDeliveryToggle = document.getElementById("quickDeliveryToggle");
const quickCont=document.getElementsByClassName("quick-delivery-toggle")
if (quickDeliveryToggle) {
  quickDeliveryToggle.addEventListener("change", function() {
    updateDeliveryMethod();
    quickCont[0].style.borderColor = this.checked ? "#e0576e" : "#eee";
  });
}

// Function to update delivery method (standard or quick)
function updateDeliveryMethod() {
  const quickDeliveryToggle = document.getElementById("quickDeliveryToggle");
  const selectedAddress = document.querySelector(".address-card.selected");
  
  if (!selectedAddress) {
    alertBox("Please select a delivery address first", "info", 3000);
    // Reset toggle if no address selected
    if (quickDeliveryToggle) {
      quickDeliveryToggle.checked = false;
    }
    return;
  }
  
  // Get current cart data
  const subtotal = parseFloat(document.getElementById("subtotal").textContent.replace("₹", "")) || 0;
  const currentDiscount = parseFloat(document.getElementById("discount").textContent.replace("₹", "")) || 0;
  
  // Get standard and quick delivery charges from the selected address
  let standardDeliveryCharge = parseFloat(selectedAddress.dataset.deliveryCharge) || 0;
  const quickDeliveryCharge = parseFloat(selectedAddress.dataset.quickDeliveryCharge) || 0;


  let deliveryCharge = standardDeliveryCharge;
  let deliveryText = "Standard Delivery (2-3 days)";
  
  // Update delivery method text and charge based on toggle state
  if (quickDeliveryToggle && quickDeliveryToggle.checked) {
    deliveryCharge = quickDeliveryCharge;
    deliveryText = "Quick Delivery (Get it Tomorrow)";
    
    // Show the quick delivery badge
    const quickBadge = document.getElementById("quickDeliveryBadge");
    if (quickBadge) {
      quickBadge.style.display = "flex";
    }
  } else {
    // Hide the quick delivery badge
    const quickBadge = document.getElementById("quickDeliveryBadge");
    if (quickBadge) {
      quickBadge.style.display = "none";
    }
  }
  
  // Update delivery text
  const deliveryMethodText = document.getElementById("deliveryMethodText");
  if (deliveryMethodText) {
    deliveryMethodText.textContent = deliveryText;
  }
  
  // Update delivery charge in cart summary
  document.getElementById("deliveryCharge").textContent = `₹${deliveryCharge}`;
  
  // Update total
  const total = subtotal + deliveryCharge - currentDiscount;
  document.getElementById("totalAmount").textContent = `₹${Math.max(0, total)}`;
}