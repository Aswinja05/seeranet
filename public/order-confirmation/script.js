

let orderId = window.location.pathname.split("/").pop();

async function payNow() {
  const response = await fetch(`/paynow/${orderId}`);
  const data = await response.json();
  
  const options = {
    key: data.key,
    amount: data.amount,
    currency: data.currency,
    name: "Seera - Your DoorStep Tailor",
    description: "Tailoring Order Payment",
    order_id: data.orderId,
    handler: async function (response) {
      // On successful payment
      const verify = await fetch("/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          paymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        }),
      });

      const result = await verify.json();
      if (result.success) {
        alert("Payment successful!");
        window.location.href = `/myOrders`; 
        // Optional: redirect to order success page
      } else {
        alert("Payment failed verification.");
      }
    },
    theme: {
      color: "#e0576e",
    },
  };

  const rzp = new Razorpay(options);
  rzp.open();
}
window.addEventListener("load", async () => {
     
    payNow();
})