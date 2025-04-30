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
const referralCode = urlParams.get('referral');
  
  if (referralCode) {
    // If referral code exists in URL, populate the referral code field
    const referralCodeInput = document.getElementById('referralCode');
    if (referralCodeInput) {
      referralCodeInput.value = referralCode;
      
      // You could also validate the referral code here
      validateReferralCode(referralCode);
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
const referralCodeInput = document.getElementById('referralCode');
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
   alert("Please enter a valid phone number");
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
   alert("Error sending OTP: " + error.message);
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
   alert("Please enter a valid 6-digit OTP");
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
     alert(
       "Account already exists with this phone number. Redirecting to login..."
     );
     window.location.href = "/loginPage";
   } else {
     // Show registration form
     document.getElementById(
       "phoneVerificationContainer"
     ).style.display = "none";
     document.getElementById("registerForm").style.display = "block";
     if (referralCode) {
      document.getElementById("referal").value = referralCode;
     }
   }
 } catch (error) {
   console.error("Error verifying OTP:", error);
   alert("Error verifying OTP: " + error.message);
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
   alert("OTP sent again!");
 } catch (error) {
   console.error("Error resending OTP:", error);
   alert("Error resending OTP: " + error.message);
 }
});

// Handle registration form submission
document
.getElementById("registerForm")
.addEventListener("submit", async (e) => {
 e.preventDefault();

 const name = document.getElementById("fullName").value;
 const email = document.getElementById("email").value;
 const password = document.getElementById("password").value;
 const confirmPassword =
   document.getElementById("confirmPassword").value;
  const referalCode = document.getElementById("referal").value;
 const terms = document.getElementById("terms").checked;

 // Basic validation
 if (password !== confirmPassword) {
   alert("Passwords do not match");
   return;
 }

 if (!terms) {
   alert("Please agree to the Terms of Service and Privacy Policy");
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
       password,
       referalCode,
       firebaseToken: firebaseIdToken,
     }),
   });

   const data = await response.json();

   if (data.success) {
     alert("Registration successful! Welcome to Seera.");
     // Redirect to home page or dashboard
     window.location.href = "/";
   } else {
     alert(data.error || "Registration failed. Please try again.");
   }
 } catch (error) {
   console.error("Registration error:", error);
   alert("An error occurred. Please try again later.");
 }
});