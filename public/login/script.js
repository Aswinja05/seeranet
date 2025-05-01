import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDnY863i24jhaOSQ9eHsA_FPZRho37J3dY",
    authDomain: "starry-hawk-458407-d2.firebaseapp.com",
    projectId: "starry-hawk-458407-d2",
    storageBucket: "starry-hawk-458407-d2.firebasestorage.app",
    messagingSenderId: "542074785081",
    appId: "1:542074785081:web:12285d55036c0f79b92ce8",
    measurementId: "G-K4Y6BL7656"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // ✅ Correctly initialized

let confirmationResult;

// ✅ Setup reCAPTCHA
const setupRecaptcha = () => {
  window.recaptchaVerifier = new RecaptchaVerifier(
    auth ,
    "recaptcha-container",
    {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA solved");
      },
    },
    // ✅ Make sure this is correctly passed
  );
  return window.recaptchaVerifier.render();
};

// ✅ Form submit listener for phone number
document.getElementById("phoneNumberForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phoneNumber = "+91" + document.getElementById("phoneNumber").value.trim();

  if (!phoneNumber || phoneNumber.length < 10) {
    alertBox("Please enter a valid phone number","info", 3000);
    return;
  }

  document.getElementById("sendOtpBtn").textContent = "Sending...";
  document.getElementById("sendOtpBtn").disabled = true;

  try {
    setupRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);

    // Show OTP form
    document.getElementById("phoneNumberForm").style.display = "none";
    document.getElementById("otpVerificationForm").style.display = "block";
  } catch (error) {
    console.error("Error sending OTP:", error);
    alertBox("Error sending OTP: " + error.message,"error", 3000);
    document.getElementById("sendOtpBtn").textContent = "Send OTP";
    document.getElementById("sendOtpBtn").disabled = false;
  }
});

// ✅ OTP verification form
document.getElementById("otpVerificationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const otpCode = document.getElementById("otpCode").value.trim();

  if (!otpCode || otpCode.length !== 6) {
    alertBox("Please enter a valid 6-digit OTP","info", 3000);
    return;
  }

  document.getElementById("verifyOtpBtn").textContent = "Verifying...";
  document.getElementById("verifyOtpBtn").disabled = true;

  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    const idToken = await user.getIdToken();

    const response = await fetch("/api/user/phoneLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: user.phoneNumber,
        firebaseToken: idToken,
      }),
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = "/";
    } else if (data.userNotFound) {
      window.location.href = "/regPage?phone=" + encodeURIComponent(user.phoneNumber);
    } else {
      alertBox(data.error || "Login failed.","error", 3000);
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    alertBox("Error verifying OTP: " + error.message,"error", 3000);
  }

  document.getElementById("verifyOtpBtn").textContent = "Verify OTP";
  document.getElementById("verifyOtpBtn").disabled = false;
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
