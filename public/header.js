// header.js

// Sets up responsive menu and profile/login/signup links
function setHeader() {
    // Menu toggle for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
  
    menuToggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  
    // Base navigation items
    menu.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="subscriptions.html">Subscriptions</a></li>
      <li><a href="contact.html">Contact Us</a></li>
      <li><a href="about.html">About Us</a></li>
    `;
  
    const userId = localStorage.getItem('userId');
    if (userId) {
      // Logged-in user: show profile dropdown
      const profileItem = document.createElement('li');
      profileItem.classList.add('profile-dropdown');
      profileItem.innerHTML = `
        <button class="profile-dropbtn">Profile ▾</button>
        <ul class="profile-dropdown-content">
          <li><a href="profile.html">My Profile</a></li>
          <li><a href="meal_plan.html">Meal Plan</a></li>
          <li><a href="find_recipes.html">Find Recipes</a></li>
          <li><a href="favorites.html">Favorites</a></li>
          <li><a href="#" id="logout-link">Log Out</a></li>
        </ul>
      `;
      menu.appendChild(profileItem);
  
      // Attach logout handler
      setTimeout(() => {
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
          logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userId');
            window.location.href = 'index.html';
          });
        }
      }, 0);
    } else {
      // Guest user: show login and signup
      const loginItem = document.createElement('li');
      loginItem.innerHTML = `<a href="login.html">Login</a>`;
      menu.appendChild(loginItem);
  
      const signupItem = document.createElement('li');
      signupItem.innerHTML = `<a href="signup.html">Sign Up</a>`;
      menu.appendChild(signupItem);
    }
  }
  
  // Expose for use in HTML
  window.setHeader = setHeader;
  
  // Logout helper (if not using inline)
  function logout() {
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
  }
  window.logout = logout;
  
  
