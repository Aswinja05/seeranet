console.log("hi")
function updateUserCoins() {
    // Check if user is logged in first
    fetch("/auth/status")
      .then(response => response.json())
      .then(data => {
        if (data.loggedIn) {
          // User is logged in, fetch their profile data
          return fetch("/api/user/profile");
        } else {
          // User is not logged in, return a default response
          return Promise.resolve({ user: { coins: 0 } });
        }
      })
      .then(response => {
        if (response.user) {
          // If we got a direct object (from our Promise.resolve above)
          return response;
        } else {
          // Parse the JSON from the actual fetch
          return response.json();
        }
      })
      .then(data => {
        // Update coin displays across the site
        updateCoinDisplays(data.user.coins);
      })
      .catch(error => {
        console.error("Error updating coins:", error);
      });
  }
  
  /**
   * Updates all coin display elements with the current coin count
   * @param {number} coinCount - The user's current coin count
   */
  function updateCoinDisplays(coinCount) {
    // Update header coins
    const headerCoins = document.getElementById("headerCoins");
    if (headerCoins) {
      headerCoins.textContent = coinCount;
    }
  
    // Update coins in the "UC Coins" card if it exists
    const coinsCardValue = document.querySelector(".coins-text strong");
    if (coinsCardValue) {
      coinsCardValue.textContent = `${coinCount} coins`;
    }
  
    // Update coins in profile page if it exists
    const profileCoins = document.getElementById("profileCoins");
    if (profileCoins) {
      profileCoins.textContent = coinCount;
    }
  
    // You can add more selectors here for other places where coins are displayed
  }
  
  // Call the function when the page loads
  document.addEventListener("DOMContentLoaded", function() {
    updateUserCoins();
  });
  
  // Set up a periodic refresh (every 2 minutes)
  setInterval(updateUserCoins, 120000);
  
  // Export the function so it can be called after specific actions
  // like completing a referral or after purchases
  window.updateUserCoins = updateUserCoins;