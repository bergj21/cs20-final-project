function setHeader() {
    // set up menu toggle for small screens
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    menuToggle.addEventListener('click', function () {
        menu.classList.toggle('active');
    });

    menu.innerHTML = `
        <li><a href="index.html">Home</a></li>
        <li><a href="subscriptions.html">Subscriptions</a></li>
        <li><a href="contact.html">Contact Us</a></li>
        <li><a href="about.html">About Us</a></li>
    `;

    if (localStorage.getItem('userId')) {
        // Add "Logout" or "Profile" button
        const profileItem = document.createElement('li');
        profileItem.classList.add('profile-dropdown');

        profileItem.innerHTML = `
            <button class="profile-dropbtn">Profile ▾</button>
            <ul class="profile-dropdown-content">
                <li><a href="profile.html">My Profile</a></li>
                <li><a href="meal_plan.html">Meal Plan</a></li>
                <li><a href="find_recipes.html">Find Recipes</a></li>
                <li><a href="grocery_list.html">Grocery List</a></li>
                <li><a href="#" id="logout-link">Logout</a></li>
            </ul>
        `;
        menu.appendChild(profileItem);

        // Add logout functionality
        setTimeout(() => {
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('userId');
                    window.location.href = 'index.html';
                });
            }
        }, 0); // wait until it's added to DOM
    } else {
        const loginItem = document.createElement('li');
        loginItem.innerHTML = `<a href="login.html">Login</a>`;
        menu.appendChild(loginItem);
    }
}
