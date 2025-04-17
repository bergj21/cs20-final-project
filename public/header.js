

function setHeader()
{
    // set up menu toggle for small screens
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    menuToggle.addEventListener('click', function () {
        menu.classList.toggle('active');
    });

    // Check session status from API
    fetch('/api/user')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) 
            {
                // Add "Logout" or "Profile" button
                const profileItem = document.createElement('li');
                profileItem.classList.add('profile-dropdown');
                
                profileItem.innerHTML = `
                    <button class="profile-dropbtn">Profile ▾</button>
                    <ul class="profile-dropdown-content">
                        <li><a href="profile.html">My Profile</a></li>
                        <li><a href="preferences.html">Preferences</a></li>
                        <li><a href="grocery_list.html">Grocery List</a></li>
                        <li><a href="favorites.html">Favorite Recipes</a></li>
                        <li><a href="logout.html">Logout</a></li>
                    </ul>
                `;
                menu.appendChild(profileItem);
            } 
            else 
            {
                const loginItem = document.createElement('li');
                loginItem.innerHTML = `<a href="login.html">Login</a>`;
                menu.appendChild(loginItem);
            }
        });
}