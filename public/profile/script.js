//Script for profile page
fetch("/auth/status")
  .then((res) => res.json())
  .then((data) => {
    if (!data.loggedIn) {
      // Redirect to login or show a message
      window.location.href = '/login';
    } else {
      // isLoggedIn = true;
      // loginBtn.style.display = "none";
    }
  });

// Tab switching functionality
const tabs = document.querySelectorAll(".profile-tab");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabId = tab.getAttribute("data-tab");

    // Remove active class from all tabs and contents
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    // Add active class to clicked tab and corresponding content
    tab.classList.add("active");
    document.getElementById(`${tabId}Tab`).classList.add("active");
  });
});

// Edit profile functionality
const editProfileBtn = document.getElementById("editProfileBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editProfileSection = document.getElementById("editProfileSection");
const editProfileForm = document.getElementById("editProfileForm");

editProfileBtn.addEventListener("click", () => {
  // Populate form with current values
  document.getElementById("editName").value =
    document.getElementById("detailName").textContent;
  document.getElementById("editEmail").value =
    document.getElementById("detailEmail").textContent;
  document.getElementById("editPhone").value =
    document.getElementById("detailPhone").textContent;

  // Show edit form
  editProfileSection.style.display = "block";
});

cancelEditBtn.addEventListener("click", () => {
  editProfileSection.style.display = "none";
});

editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("editName").value;
  const email = document.getElementById("editEmail").value;
  const phone = document.getElementById("editPhone").value;

  try {
    const response = await fetch("/api/user/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone }),
    });

    const data = await response.json();

    if (data.success) {
      // Update displayed values
      document.getElementById("userName").textContent = name;
      document.getElementById("detailName").textContent = name;
      document.getElementById("userEmail").textContent = email;
      document.getElementById("detailEmail").textContent = email;
      document.getElementById("userPhone").textContent = phone;
      document.getElementById("detailPhone").textContent = phone;

      // Update initials
      const nameParts = name.split(" ");
      let initials = nameParts[0].charAt(0).toUpperCase();
      if (nameParts.length > 1) {
        initials += nameParts[1].charAt(0).toUpperCase();
      }
      document.getElementById("profileInitials").textContent = initials;

      // Hide edit form
      editProfileSection.style.display = "none";

      alertBox("Profile updated successfully!", "success", 3000);
    } else {
      alertBox(data.error || "Failed to update profile. Please try again.", "error", 3000);
    }
  } catch (error) {
    console.error("Update profile error:", error);
    alertBox("An error occurred. Please try again later.", "error", 3000);
  }
});

// Address functionality
const addAddressBtn = document.getElementById("addAddressBtn");
const cancelAddressBtn = document.getElementById("cancelAddressBtn");
const addAddressSection = document.getElementById("addAddressSection");
const addAddressForm = document.getElementById("addAddressForm");

addAddressBtn.addEventListener("click", () => {
  addAddressSection.style.display = "block";
});

cancelAddressBtn.addEventListener("click", () => {
  addAddressSection.style.display = "none";
});

addAddressForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("addressType").value;
  const street = document.getElementById("addressStreet").value;
  const city = document.getElementById("addressCity").value;
  const state = document.getElementById("addressState").value;
  const pincode = document.getElementById("addressPincode").value;
  const isDefault = document.getElementById("isDefaultAddress").checked;

  try {
    const response = await fetch("/api/user/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        street,
        city,
        state,
        pincode,
        isDefault,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Reload addresses
      loadAddresses();

      // Reset form and hide
      addAddressForm.reset();
      addAddressSection.style.display = "none";

      alertBox("Address added successfully!", "success", 3000);
    } else {
      alertBox(data.error || "Failed to add address. Please try again.", "error", 3000);
    }
  } catch (error) {
    console.error("Add address error:", error);
    alertBox("An error occurred. Please try again later.", "error", 3000);
  }
});

// Update the copy referral code functionality to use the new API-provided code
const copyCodeBtn = document.getElementById("copyCodeBtn");

copyCodeBtn.addEventListener("click", () => {
  const referralCode = document.getElementById("referralCode").textContent;

  // Copy to clipboard
  navigator.clipboard
    .writeText(referralCode)
    .then(() => {
      copyCodeBtn.textContent = "Copied!";
      setTimeout(() => {
        copyCodeBtn.textContent = "Copy";
      }, 2000);
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
      alertBox("Failed to copy referral code","error", 3000);
    });
});
// Social sharing functionality
const shareOptions = document.querySelectorAll(".share-option");

shareOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const referralCode = document.getElementById("referralCode").textContent;
    const shareMessage = `Join Seera and get 50 coins on signup! Use my referral code: ${referralCode}`;
    const shareUrl = "https://seeranet.in/register?referral=" + referralCode;

    if (option.title === "WhatsApp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(
          shareMessage + " " + shareUrl
        )}`,
        "_blank"
      );
    } else if (option.title === "Facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}&quote=${encodeURIComponent(shareMessage)}`,
        "_blank"
      );
    } else if (option.title === "Twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareMessage
        )}&url=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    } else if (option.title === "Email") {
      window.location.href = `mailto:?subject=Join Seera&body=${encodeURIComponent(
        shareMessage + "\n\n" + shareUrl
      )}`;
    }
  });
});

// Function to load user data
async function loadUserData() {
  try {
    const response = await fetch("/api/user/profile");
    const data = await response.json();

    if (data.user) {
      const user = data.user;

      // Update profile header
      document.getElementById("userName").textContent = user.name;
      document.getElementById("userEmail").textContent = user.email;
      document.getElementById("userPhone").textContent = user.phone;
      document.getElementById("userCoins").textContent = user.coins;
      document.getElementById("headerCoins").textContent = user.coins;

      // Update profile details
      document.getElementById("detailName").textContent = user.name;
      document.getElementById("detailEmail").textContent = user.email;
      document.getElementById("detailPhone").textContent = user.phone;

      // Update initials
      const nameParts = user.name.split(" ");
      let initials = nameParts[0].charAt(0).toUpperCase();
      if (nameParts.length > 1) {
        initials += nameParts[1].charAt(0).toUpperCase();
      }
      document.getElementById("profileInitials").textContent = initials;

      // Load addresses
      if (user.addresses && user.addresses.length > 0) {
        renderAddresses(user.addresses);
      } else {
        document.getElementById("addressesList").innerHTML =
          "<p>No addresses saved yet.</p>";
      }

      // Update referral code - get from user data instead of localStorage
      document.getElementById("referralCode").textContent = user.referralCode || "SEERA50";
      
      // Load referral history
      loadReferralHistory();
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    // Handle failed authentication
    window.location.href = "/loginPage";
  }
}

// Function to load referral history
async function loadReferralHistory() {
  try {
    const response = await fetch("/api/user/referrals");
    const data = await response.json();
    
    const referralHistoryContainer = document.getElementById("referralHistory");
    
    if (data.referralHistory && data.referralHistory.length > 0) {
      let historyHTML = '<div class="referral-history">';
      
      data.referralHistory.forEach(referral => {
        const date = new Date(referral.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
        
        historyHTML += `
          <div class="referral-item">
            <div class="referral-user">
              <span class="referral-name">${referral.name}</span>
              <span class="referral-email">${referral.email}</span>
            </div>
            <div class="referral-details">
              <span class="referral-date">${date}</span>
              <span class="referral-status ${referral.rewarded ? 'rewarded' : 'pending'}">
                ${referral.rewarded ? 'Rewarded' : 'Pending'}
              </span>
            </div>
          </div>
        `;
      });
      
      historyHTML += '</div>';
      referralHistoryContainer.innerHTML = historyHTML;
    } else {
      referralHistoryContainer.innerHTML = '<p>No referrals yet. Start sharing your code to earn coins!</p>';
    }
  } catch (error) {
    console.error("Error loading referral history:", error);
    document.getElementById("referralHistory").innerHTML = 
      '<p>Failed to load referral history. Please try again later.</p>';
  }
}

// Function to render addresses
function renderAddresses(addresses) {
  const addressesList = document.getElementById("addressesList");
  addressesList.innerHTML = "";

  addresses.forEach((address, index) => {
    const addressCard = document.createElement("div");
    addressCard.className = "address-card";

    const addressHtml = `
                    <span class="address-type">${address.type}</span>
                    ${
                      address.isDefault
                        ? '<span class="address-default">Default</span>'
                        : ""
                    }
                    <div class="address-actions">
                        <button class="edit-address" data-index="${index}"><i class="fas fa-edit"></i></button>
                        <button class="delete-address" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <div class="address-content">
                        <p>${address.street}</p>
                        <p>${address.city}, ${address.state} - ${
      address.pincode
    }</p>
                    </div>
                `;

    addressCard.innerHTML = addressHtml;
    addressesList.appendChild(addressCard);

    // Add event listeners for edit and delete buttons
    addressCard.querySelector(".edit-address").addEventListener("click", () => {
      editAddress(address, index);
    });

    addressCard
      .querySelector(".delete-address")
      .addEventListener("click", () => {
        deleteAddress(index);
      });
  });
}

// Function to edit address
function editAddress(address, index) {
  // Show address form
  document.getElementById("addAddressSection").style.display = "block";

  // Populate form with address data
  document.getElementById("addressType").value = address.type;
  document.getElementById("addressStreet").value = address.street;
  document.getElementById("addressCity").value = address.city;
  document.getElementById("addressState").value = address.state;
  document.getElementById("addressPincode").value = address.pincode;
  document.getElementById("isDefaultAddress").checked = address.isDefault;

  // Change form action to update
  const addAddressForm = document.getElementById("addAddressForm");
  addAddressForm.dataset.mode = "edit";
  addAddressForm.dataset.index = index;

  // Scroll to form
  addAddressForm.scrollIntoView({ behavior: "smooth" });
}

// Function to delete address
async function deleteAddress(index) {
  if (!confirm("Are you sure you want to delete this address?")) {
    return;
  }

  try {
    const response = await fetch(`/api/user/address/${index}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      loadUserData(); // Reload user data
      alertBox("Address deleted successfully!", "success", 3000);
    } else {
      alertBox(data.error || "Failed to delete address. Please try again.", "error", 3000);
    }
  } catch (error) {
    console.error("Delete address error:", error);
    alertBox("An error occurred. Please try again later.", "error", 3000);
  }
}

// Function to load addresses
async function loadAddresses() {
  try {
    const response = await fetch("/api/user/addresses");
    const data = await response.json();

    if (data.addresses) {
      renderAddresses(data.addresses);
    }
  } catch (error) {
    console.error("Error loading addresses:", error);
  }
}

// Function to load orders
async function loadOrders() {
  try {
    const response = await fetch("/api/user/orders");
    const data = await response.json();

    if (data.orders && data.orders.length > 0) {
      renderOrders(data.orders);
    } else {
      document.getElementById("ordersList").innerHTML =
        '<p style="padding: 20px; text-align: center;">No orders placed yet.</p>';
    }
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

// Function to render orders
function renderOrders(orders) {
  const ordersList = document.getElementById("ordersList");
  ordersList.innerHTML = "";

  orders.forEach((order) => {
    const orderItem = document.createElement("div");
    orderItem.className = "order-item";

    const statusClass = getStatusClass(order.status);
    const formattedDate = new Date(order.orderDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const orderHtml = `
                    <div class="order-header">
                        <span class="order-number">${order.orderNumber}</span>
                        <span class="order-date">${formattedDate}</span>
                    </div>
                    <div class="order-details">
                        <div>
                            <span class="order-status ${statusClass}">${order.status}</span>
                            <span class="order-total">₹${order.total}</span>
                        </div>
                        <a href="/order-confirmation/${order.orderNumber}">View Details</a>
                    </div>
                `;

    orderItem.innerHTML = orderHtml;
    ordersList.appendChild(orderItem);
  });
}

// Helper function to get status class
function getStatusClass(status) {
  switch (status) {
    case "Placed":
    case "Processing":
      return "status-processing";
    case "Ready":
    case "Out for Delivery":
      return "status-processing";
    case "Delivered":
      return "status-delivered";
    case "Cancelled":
      return "status-cancelled";
    default:
      return "status-processing";
  }
}

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("/api/user/logout", {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = "/loginPage";
    } else {
      alertBox("Failed to logout. Please try again.", "error", 3000);
    }
  } catch (error) {
    console.error("Logout error:", error);
    alertBox("An error occurred. Please try again later.", "error", 3000);
  }
});

// Initialize page
window.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  loadOrders();
});
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
