import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnY863i24jhaOSQ9eHsA_FPZRho37J3dY",
  authDomain: "starry-hawk-458407-d2.firebaseapp.com",
  projectId: "starry-hawk-458407-d2",
  storageBucket: "starry-hawk-458407-d2.firebasestorage.app",
  messagingSenderId: "542074785081",
  appId: "1:542074785081:web:12285d55036c0f79b92ce8",
  measurementId: "G-K4Y6BL7656",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize variables
const auth = firebase.auth();
let confirmationResult = null;
let verifiedPhoneNumber = null;
let firebaseIdToken = null;
let globalReferralCode = null; // Global variable to store referral code

// Check if there's a phone number in URL params (coming from login redirect)
window.onload = function () {
  // Setup reCAPTCHA verifier
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
   "recaptcha-container",
   {
     size: "invisible",
     callback: (response) => {
       // reCAPTCHA solved, allow sending OTP
     },
   }
  );

  // Check for phone number in URL
  const urlParams = new URLSearchParams(window.location.search);
  const phoneParam = urlParams.get("phone");
  globalReferralCode = urlParams.get('referral');
    
  if (globalReferralCode) {
    // If referral code exists in URL, populate the referral code field
    const referralCodeInput = document.getElementById('referal');
    if (referralCodeInput) {
      referralCodeInput.value = globalReferralCode;
      
      // You could also validate the referral code here
      validateReferralCode(globalReferralCode);
    }
  }
  
  if (phoneParam) {
   document.getElementById("phoneNumber").value = phoneParam.replace(
     "+91",
     ""
   );
  }
};

async function validateReferralCode(code) {
  try {
    const response = await fetch('/api/user/validate-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ referralCode: code })
    });
    
    const data = await response.json();
    
    if (data.valid) {
      // Show valid referral code message
      const referralFeedback = document.getElementById('referralFeedback');
      if (referralFeedback) {
        referralFeedback.textContent = '✓ Valid referral code';
        referralFeedback.style.color = 'green';
        referralFeedback.style.display = 'block';
      }
    } else {
      // Show invalid referral code message
      const referralFeedback = document.getElementById('referralFeedback');
      if (referralFeedback) {
        referralFeedback.textContent = '✗ Invalid referral code';
        referralFeedback.style.color = 'red';
        referralFeedback.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error validating referral code:', error);
  }
}

// Add event listener to validate referral code on blur
const referralCodeInput = document.getElementById('referal');
if (referralCodeInput) {
  referralCodeInput.addEventListener('blur', () => {
    const code = referralCodeInput.value.trim();
    if (code) {
      validateReferralCode(code);
    }
  });
}

// Handle phone number form submission
document
.getElementById("phoneNumberForm")
.addEventListener("submit", async (e) => {
 e.preventDefault();

 const phoneNumber =
   "+91" + document.getElementById("phoneNumber").value.trim();
 if (!phoneNumber || phoneNumber.length < 10) {
   alertBox("Please enter a valid phone number", "info", 3000);
   return;
 }

 try {
   // Send OTP
   document.getElementById("sendOtpBtn").textContent = "Sending...";
   document.getElementById("sendOtpBtn").disabled = true;

   confirmationResult = await auth.signInWithPhoneNumber(
     phoneNumber,
     window.recaptchaVerifier
   );

   // Show OTP form
   document.getElementById("phoneNumberForm").style.display = "none";
   document.getElementById("otpVerificationForm").style.display =
     "block";
 } catch (error) {
   console.error("Error sending OTP:", error);
   alertBox("Error sending OTP: " + error.message,"error", 3000);
   document.getElementById("sendOtpBtn").textContent = "Send OTP";
   document.getElementById("sendOtpBtn").disabled = false;

   // Reset reCAPTCHA
   window.recaptchaVerifier.clear();
   window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
     "recaptcha-container",
     {
       size: "invisible",
     }
   );
 }
});

// Handle OTP verification form submission
document
.getElementById("otpVerificationForm")
.addEventListener("submit", async (e) => {
 e.preventDefault();

 const otpCode = document.getElementById("otpCode").value.trim();
 if (!otpCode || otpCode.length !== 6) {
   alertBox("Please enter a valid 6-digit OTP", "info", 3000);
   return;
 }

 try {
   document.getElementById("verifyOtpBtn").textContent =
     "Verifying...";
   document.getElementById("verifyOtpBtn").disabled = true;

   // Verify OTP
   const result = await confirmationResult.confirm(otpCode);

   // User signed in successfully with phone number
   const user = result.user;
   firebaseIdToken = await user.getIdToken();
   verifiedPhoneNumber = user.phoneNumber;

   // Check if user already exists in your database
   const checkResponse = await fetch("/api/user/checkPhone", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({ phoneNumber: verifiedPhoneNumber }),
   });

   const checkData = await checkResponse.json();

   if (checkData.exists) {
     // User exists, redirect to login
     alertBox(
       "Account already exists with this phone number. Redirecting to login...","warning", 3000
     );
     window.location.href = "/loginPage";
   } else {
     // Show registration form
     document.getElementById(
       "phoneVerificationContainer"
     ).style.display = "none";
     document.getElementById("registerForm").style.display = "block";
     
     // Set referral code if it exists
     if (globalReferralCode) {
       document.getElementById("referal").value = globalReferralCode;
     }
   }
 } catch (error) {
   console.error("Error verifying OTP:", error);
   alertBox("Error verifying OTP: " + error.message, "error", 3000);
   document.getElementById("verifyOtpBtn").textContent = "Verify OTP";
   document.getElementById("verifyOtpBtn").disabled = false;
 }
});

// Handle resend OTP
document
.getElementById("resendOtp")
.addEventListener("click", async (e) => {
 e.preventDefault();

 const phoneNumber =
   "+91" + document.getElementById("phoneNumber").value.trim();

 try {
   // Reset reCAPTCHA
   window.recaptchaVerifier.clear();
   window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
     "recaptcha-container",
     {
       size: "invisible",
     }
   );

   // Resend OTP
   confirmationResult = await auth.signInWithPhoneNumber(
     phoneNumber,
     window.recaptchaVerifier
   );
   alertBox("OTP sent again!", "info", 3000);
 } catch (error) {
   console.error("Error resending OTP:", error);
   alertBox("Error resending OTP: " + error.message,"error", 3000);
 }
});

// Handle registration form submission
document
.getElementById("registerForm")
.addEventListener("submit", async (e) => {
 e.preventDefault();

 const name = document.getElementById("fullName").value;
 const email = document.getElementById("email").value;
 const referalCode = document.getElementById("referal").value;
 const terms = document.getElementById("terms").checked;

 

 if (!terms) {
   alertBox("Please agree to the Terms of Service and Privacy Policy",  "info", 3000);
   return;
 }

 try {
   const response = await fetch("/api/user/registerWithPhone", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       name,
       email,
       phone: verifiedPhoneNumber,
       referralCode: referalCode, // Corrected variable name here
       firebaseToken: firebaseIdToken,
     }),
   });

   const data = await response.json();

   if (data.success) {
     alertBox("Registration successful! Welcome to Seera.", "success", 3000);
     // Redirect to home page or dashboard
     window.location.href = "/";
   } else {
     alertBox(data.error || "Registration failed. Please try again.", "error", 3000);
   }
 } catch (error) {
   console.error("Registration error:", error);
   alertBox("An error occurred. Please try again later.", "error", 3000);
 }
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
