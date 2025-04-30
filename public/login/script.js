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
    alert("Please enter a valid phone number");
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
    alert("Error sending OTP: " + error.message);
    document.getElementById("sendOtpBtn").textContent = "Send OTP";
    document.getElementById("sendOtpBtn").disabled = false;
  }
});

// ✅ OTP verification form
document.getElementById("otpVerificationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const otpCode = document.getElementById("otpCode").value.trim();

  if (!otpCode || otpCode.length !== 6) {
    alert("Please enter a valid 6-digit OTP");
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
      alert(data.error || "Login failed.");
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    alert("Error verifying OTP: " + error.message);
  }

  document.getElementById("verifyOtpBtn").textContent = "Verify OTP";
  document.getElementById("verifyOtpBtn").disabled = false;
});
