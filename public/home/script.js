window.addEventListener('load', () => {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('content').style.display = 'block';
});


let loginBtn = document.querySelector(".loginBtn");
let isLoggedIn = false;
fetch("/auth/status")
  .then((res) => res.json())
  .then((data) => {
    if (!data.loggedIn) {
      // Redirect to login or show a message
      // window.location.href = '/login';
    } else {
      isLoggedIn = true;
      loginBtn.style.display = "none";
    }
  });
let category_items = document.querySelectorAll(".category-item");

category_items.forEach((item) => {
  item.addEventListener("click", function () {
    let category = item.getAttribute("data-category");
    let popup = document.querySelector(".popup");
    popup.classList.add("active");
    popup.style.display = "flex";
    let popup_content = document.querySelector(".popup-content");

    if (category !== "blouse" && category !== "draping") {
      popup_content.innerHTML = `<h2>Coming Soon</h2>
        <p>Stay tuned for more updates!</p>`;
      popup_content.style.display = "flex";
      popup_content.style.justifyContent = "center";
      popup_content.style.flexDirection = "column";
      popup_content.style.alignItems = "center";
      setTimeout(() => {
        popup.classList.remove("active");
        popup.style.display = "none";
        popup_content.style.display = "";
        popup_content.style.justifyContent = "";
        popup_content.style.flexDirection = "";
        popup_content.style.alignItems = "stretch";
        console.log("hidden after 5 seconds");
      }, 3000);
    } else if (category === "blouse") {
      popup_content.innerHTML = `<div class="popup-item" type="plain"><img src="imgs/WhatsApp Image 2025-04-08 at 14.24.17_f895c482.jpg" alt="" srcset="" height="40%" width="fit-content">Plain Blouse</div>
        <div class="popup-item" type="Designer"><img src="imgs/image.png" alt="" srcset="" height="40%" width="fit-content">Designer Blouse</div>
        <div class="popup-item" type="aari"><img src="imgs/WhatsApp_Image_2025-04-08_at_14.24.53_b1949905-removebg-preview.png" alt="" srcset="" height="40%" width="fit-content">Aari Work Blouse</div>
`;
      let popup_items = document.querySelectorAll(".popup-item");
      popup_items.forEach((item) => {
        item.addEventListener("click", function () {
          let type = item.getAttribute("type");
          item.style.backgroundColor = "#caffc8";
          item.style.border = "2px solid black";
          if (isLoggedIn) {
            window.location.href = `/booking/blouse`;
          } else {
            window.location.href = `/loginPage`;
          }
        });
      });
    } else if (category === "draping") {
      if (isLoggedIn) {
        window.location.href = `/booking/draping`;
      } else {
        window.location.href = `/loginPage`;
      }
    }
  });
});
