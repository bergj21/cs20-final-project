// header.js
function setHeader() {
    const menu = document.querySelector('.menu');
    menu.innerHTML = '';
    const userId = localStorage.getItem('userId');
  
    // Always include Home
    menu.innerHTML += `<li><a href="index.html">Home</a></li>`;
  
    if (userId) {
      // logged-in menu
      menu.innerHTML += `
        <li><a href="meal_plan.html">Meal Plan</a></li>
        <li><a href="find_recipes.html">Find a Recipe</a></li>
        <li><a href="grocery_list.html">Grocery List</a></li>
        <li><a href="favorites.html">Favorites</a></li>
        <li><a href="profile.html">Profile</a></li>
        <li><button onclick="logout()">Log Out</button></li>
      `;
    } else {
      // guest menu
      menu.innerHTML += `
        <li><a href="subscriptions.html">Subscriptions</a></li>
        <li><a href="about.html">About Us</a></li>
        <li><a href="contact.html">Contact Us</a></li>
        <li><a href="login.html">Sign In</a></li>
        <li><a href="/signup.html">Sign Up</a></li>
      `;
    }
  }
  
  function logout() {
    localStorage.removeItem('userId');
    window.location.href = '/';
  }
  
