

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
                    <div class="profile-dropdown-content">
                        <a href="profile.html">My Profile</a>
                        <a href="preferences.html">Preferences</a>
                        <a href="grocery_list.html">Grocery List</a>
                        <a href="favorite_recipes.html">Favorite Recipes</a>
                        <a href="logout.html">Logout</a>
                    </div>
                `;
                alert("GOT to the logged in?");
                menu.appendChild(profileItem);
                alert("Appended the child");
            } 
            else 
            {
                alert("NOT logged in");
                const loginItem = document.createElement('li');
                loginItem.innerHTML = `<a href="login.html">Login</a>`;
                menu.appendChild(loginItem);
            }
        });
}