// Main routing function to determine which page to load
console.log(window.location.pathname === "/booking/blouse");
let bookingContainer = document.getElementsByClassName("booking-container")[0];

// Route handling
if (window.location.pathname === "/booking/blouse") {
  renderBlousePage();
} else if (window.location.pathname === "/booking/draping") {
  renderDrapingPage();
}

// ====== BLOUSE PAGE FUNCTIONALITY ======

// Render the blouse booking page HTML
function renderBlousePage() {
  bookingContainer.innerHTML = `
      <div class="section">
        <h2 class="section-title">Select Lining Option</h2>
        <div class="options-grid">
          <div class="option-card selected">
            <div class="option-check"><i class="fas fa-check"></i></div>
            <div class="option-name">Without Lining</div>
            <div class="option-price">Free</div>
          </div>

          <div class="option-card">
            <div class="option-check"><i class="fas fa-check"></i></div>
            <div class="option-name">With Lining</div>
            <div class="option-price">
              <span class="price-highlight">+₹49</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Design Selection Section -->
      <div class="section">
        <h2 class="section-title">Choose Design</h2>
        
        <div class="design-gallery">
            
          <div class="design-item selected">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-09 at 19.41.16_9df32446.jpg"
                alt="Classic Design"
              />
            </div>
            <div class="design-name">Classic</div>
            <div class="option-price">Free</div>
          </div>

          <div class="design-item">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-08 at 22.12.32_bf96343f.jpg"
                alt="Sleeveless"
              />
            </div>
            <div class="design-name">Sleeveless</div>
            <div class="option-price">Free</div>
          </div>

          <div class="design-item">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-08 at 22.12.33_5ac72e2e.jpg"
                alt="Princess Cut"
              />
            </div>
            <div class="design-name">Princess Cut</div>
            <div class="option-price-type">
              <span class="price-highlight">+₹149</span>
            </div>
          </div>

          <div class="design-item">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-08 at 22.12.32_eefd16f4.jpg"
                alt="High Neck"
              />
            </div>
            <div class="design-name">High Neck</div>
            <div class="option-price-type">
              <span class="price-highlight">+₹89</span>
            </div>
          </div>

          <div class="design-item">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-08 at 22.12.34_66b5aca8.jpg"
                alt="Boat Neck"
              />
            </div>
            <div class="design-name">Boat Neck</div>
            <div class="option-price-type">
              <span class="price-highlight">+₹89</span>
            </div>
          </div>

          <div class="design-item">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-08 at 22.12.31_004fcb1e.jpg"
                alt="Designer Back"
              />
            </div>
            <div class="design-name">Back Design</div>
            <div class="option-price-type">
              <span class="price-highlight">+₹199</span>
            </div>
          </div>
        </div>
      <div class="upload-desc">
          <div class="description-box">
            <textarea id="description" class="instruction-box" rows="4" placeholder="Add any special instructions or requests here..."></textarea>
          </div>
        </div>
        <div class="upload-box">
          <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <div class="upload-text">Upload Reference Image</div>
          <div class="upload-note">JPG, PNG or PDF, max 5MB</div>
        </div>
      </div>

      <!-- Measurement Options Section -->
      <div class="section">
        <h2 class="section-title">Measurement Options</h2>
        <div class="options-grid">
          <div class="option-card selected">
            <div class="option-check"><i class="fas fa-check"></i></div>
            <div class="option-image">
              <img
                src="/imgs/ChatGPT Image Apr 9, 2025, 08_05_54 PM.png"
                alt="Provide Blouse for Measurement"
              />
            </div>
            <div class="option-name">Provide Measurement Blouse</div>
            <div class="option-price">Free</div>
          </div>

          <div class="option-card">
            <div class="option-check"><i class="fas fa-check"></i></div>
            <div class="option-image">
              <img
                src="/imgs/ChatGPT Image Apr 9, 2025, 07_58_31 PM.png"
                alt="Home Visit for Measurement"
              />
            </div>
            <div class="option-name">Home Visit for Measurement</div>
            <div class="option-price">
              <span class="price-highlight">+₹89</span>
            </div>
          </div>
        </div>

        
      </div>

      <!-- Total Section -->
      <div class="total-section">
        <div class="total-row">
          <span>Base Price</span>
          <span>₹249</span>
        </div>
        <div class="total-row">
          <span>Lining</span>
          <span>₹0</span>
        </div>
        <div class="total-row">
          <span>Measurement</span>
          <span>₹0</span>
        </div>
        <div class="total-row">
          <span>Design</span>
          <span id="design-charge">₹0</span>
        </div>
        <div class="total-row">
          <span>Total</span>
          <span id="design-charge">₹0</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span>₹249</span>
        </div>
      </div>
       
      <!-- Button Group -->
      <div class="button-group">
        <button class="btn btn-primary">Add to Cart</button>
      </div>`;

  // Initialize blouse page event listeners
  initializeBlousePageEvents();
}

// Initialize event listeners and functionality for blouse page
function initializeBlousePageEvents() {
  const optionCards = document.querySelectorAll(".option-card");
  const designItems = document.querySelectorAll(".design-item");

  // Setup option selection
  optionCards.forEach((card) => {
    if (!card.style.cursor || card.style.cursor !== "not-allowed") {
      card.addEventListener("click", function() {
        const group = this.closest(".options-grid");
        
        group.querySelectorAll(".option-card").forEach((c) => {
          c.classList.remove("selected");
        });
        
        this.classList.add("selected");
        updateBlouseTotal();
      });
    }
  });

  // Setup design selection
  designItems.forEach((item) => {
    item.addEventListener("click", function() {
      designItems.forEach((design) => {
        design.classList.remove("selected");
      });
      
      this.classList.add("selected");
      updateBlouseTotal();
    });
  });

  // Setup file upload
  setupFileUpload();

  // Setup cart button
  setupCartButton("Blouse Stitching");

  // Initial price calculation
  updateBlouseTotal();
}

// Calculate and update the blouse total price
function updateBlouseTotal() {
  let total = 249; // Base price for blouse
  let liningCharge = 0;
  let measurementCharge = 0;
  let designCharge = 0;

  // Lining Option
  const liningOption = document
    .querySelectorAll(".options-grid")[0]
    .querySelector(".option-card.selected");
  if (
    liningOption &&
    liningOption
      .querySelector(".option-name")
      .textContent.includes("With Lining")
  ) {
    liningCharge = 49;
  }

  // Measurement Option
  const measurementOption = document
    .querySelectorAll(".options-grid")[1]
    .querySelector(".option-card.selected");
  if (
    measurementOption &&
    measurementOption
      .querySelector(".option-name")
      .textContent.includes("Home Visit")
  ) {
    measurementCharge = 89;
  }

  // Design Option
  const selectedDesign = document.querySelector(".design-item.selected");
  if (selectedDesign) {
    const priceSpan = selectedDesign.querySelector(".price-highlight");
    if (priceSpan) {
      designCharge = parseInt(priceSpan.textContent.replace(/[^\d]/g, ""));
    }
  }

  // Update each row in the summary
  const totalRows = document.querySelectorAll(".total-row");
  if (totalRows.length >= 5) {
    totalRows[1].querySelector("span:last-child").textContent = `₹${liningCharge}`;
    totalRows[2].querySelector("span:last-child").textContent = `₹${measurementCharge}`;
    totalRows[3].querySelector("span:last-child").textContent = `₹${designCharge}`;
    
    const finalTotal = total + liningCharge + measurementCharge + designCharge;
    totalRows[4].querySelector("span:last-child").textContent = `₹${finalTotal}`;
    totalRows[5].querySelector("span:last-child").textContent = `₹${finalTotal}`;
  }
}

// ====== DRAPING PAGE FUNCTIONALITY ======

// Render the draping booking page HTML
function renderDrapingPage() {
  bookingContainer.innerHTML = `
      <div class="section">
        <h2 class="section-title">Select Saree Draping Style</h2>
        <div class="design-gallery">
          <div class="design-item selected">
            <div class="design-check"><i class="fas fa-check"></i></div>
            <div class="design-image">
              <img
                src="/imgs/WhatsApp Image 2025-04-10 at 16.50.34_35f47445.jpg"
                alt="Traditional Draping"
              />
            </div>
            <div class="design-name">Traditional</div>
            <div class="option-price">₹500</div>
          </div>

          
        </div>
      </div>

      
      <!-- Special Instructions -->
      <div class="section">
        <h2 class="section-title">Special Instructions</h2>
        <div class="upload-desc">
          <div class="description-box">
            <textarea id="description" class="instruction-box" rows="4" placeholder="Add any special instructions or requests here..."></textarea>
          </div>
        </div>
        <div class="upload-box">
          <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <div class="upload-text">Upload Reference Image</div>
          <div class="upload-note">JPG, PNG or PDF, max 5MB</div>
        </div>
        
      </div>

      <!-- Total Section -->
      <div class="total-section">
        <div class="total-row">
          <span>Draping Style</span>
          <span id="draping-charge">₹999</span>
        </div>
        
        <div class="total-row">
          <span>Location Fee</span>
          <span id="location-charge">₹0</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span id="total-charge">₹999</span>
        </div>
      </div>

      <!-- Button Group -->
      <div class="button-group">
        <button class="btn btn-primary">Add to Cart</button>
      </div>`;

  // Initialize draping page event listeners
  initializeDrapingPageEvents();
}

// Initialize event listeners and functionality for draping page
function initializeDrapingPageEvents() {
  const designItems = document.querySelectorAll(".design-item:not([style*='cursor: not-allowed'])");

  // Setup design selection
  designItems.forEach((item) => {
    item.addEventListener("click", function() {
      designItems.forEach((design) => {
        design.classList.remove("selected");
      });
      
      this.classList.add("selected");
      updateDrapingTotal();
    });
  });

  // Setup file upload
  setupFileUpload();

  // Setup cart button
  setupCartButton("Saree Draping");

  // Initial price calculation
  updateDrapingTotal();
}

// Calculate and update the draping total price
function updateDrapingTotal() {
  // Get selected draping style price
  const selectedStyle = document.querySelector(".design-item.selected");
  let drapingCharge = parseInt(selectedStyle.querySelector(".option-price").textContent.replace(/[^\d]/g, ""));
  
  // No accessories available yet
  let accessoriesCharge = 0;
  let locationCharge = 0;
  
  // Update total section
  document.getElementById("draping-charge").textContent = `₹${drapingCharge}`;
  document.getElementById("location-charge").textContent = `₹${locationCharge}`;
  document.getElementById("total-charge").textContent = `₹${drapingCharge + locationCharge}`;
}

// ====== SHARED FUNCTIONALITY ======

// Setup file upload functionality for both pages
function setupFileUpload() {
  const uploadBox = document.querySelector(".upload-box");
  if (uploadBox) {
    uploadBox.addEventListener("click", function() {
      // Create file input element if it doesn't exist
      if (!document.querySelector('input[type="file"]')) {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".jpg,.jpeg,.png,.pdf";
        fileInput.style.display = "none";
        fileInput.addEventListener("change", function() {
          if (this.files.length > 0) {
            const fileName = this.files[0].name;
            document.querySelector(".upload-text").textContent = fileName;
            document.querySelector(".upload-note").textContent = "File selected";
            document.querySelector(".upload-box").style.backgroundColor = "#fdf5f6";
          }
        });
        document.body.appendChild(fileInput);
      }
      
      // Trigger file selector
      document.querySelector('input[type="file"]').click();
    });
  }
}

// Setup cart button functionality for both pages
function setupCartButton(serviceType) {
  // Handle Add to Cart button
  const addToCartBtn = document.querySelector(".btn-primary");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function() {
      // Prepare form data based on service type
      const formData = new FormData();
      formData.append("serviceType", serviceType);
      
      if (serviceType === "Blouse Stitching") {
        // Get selected options for blouse
        const selectedLining = document
          .querySelectorAll(".options-grid")[0]
          .querySelector(".option-card.selected .option-name").textContent;
        const selectedDesign = document.querySelector(
          ".design-item.selected .design-name"
        ).textContent;
        const selectedMeasurement = document
          .querySelectorAll(".options-grid")[1]
          .querySelector(".option-card.selected .option-name").textContent;
        
        // Calculate final price
        const totalPrice = document.querySelector(".total-row.final span:last-child").textContent;
        
        formData.append("lining", selectedLining);
        formData.append("design", selectedDesign);
        formData.append("measurement", selectedMeasurement);
        formData.append("basePrice", 249);
      } 
      else if (serviceType === "Saree Draping") {
        // Get selected options for draping
        const selectedStyle = document.querySelector(".design-item.selected .design-name").textContent;
        const selectedStylePrice = parseInt(document.querySelector(".design-item.selected .option-price").textContent.replace(/[^\d]/g, ""));
        const totalPrice = document.getElementById("total-charge").textContent;
        const specialInstructions = document.querySelector(".instruction-box")?.value || "";
        
        formData.append("drapingStyle", selectedStyle);
        formData.append("design", "draping");
        formData.append("basePrice", selectedStylePrice);
        formData.append("instructions", specialInstructions);
      }
      
      // Check if reference image was uploaded
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && fileInput.files.length > 0) {
        formData.append("referenceImage", fileInput.files[0]);
      }
      const description = document.querySelector("#description")?.value || "";
      formData.append("description", description);
      console.log(formData);
      
      // Send to server
      fetch("/api/booking/add-to-cart", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Update cart badge
            const cartBadges = document.querySelectorAll(".cart-badge");
            const totalItems = data.cart.items.length;
            cartBadges.forEach((badge) => {
              badge.textContent = totalItems;
            });
            
            // Show success message
            alertBox("Item added to cart successfully!","success",3000);
          }
        })
        .catch((error) => {
          console.error("Error adding to cart:", error);
          alertBox("Failed to add item to cart. Please try again.","error",3000);
        });
    });
  }
}

// Initialize everything when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // The page-specific initialization functions are called separately
  // after their respective HTML is rendered
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
