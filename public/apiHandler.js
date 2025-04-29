// --- API Setup ---
// API key for Spoonacular (commented out alternatives for backup)
const apiKey = 'e075ef7a95604de8b1003d3e56d3b078'
// const apiKey = '5fffdd1ef2284ee7b1b869e03538f404'
// const apiKey = '00a2d2dbfecf4a8e82423a2f8415ac88'
// const apiKey = '258415058f10403486235ffa1cac1851' 
// Base API URL
const baseApi = 'https://api.spoonacular.com'

// --- Nutrient Ratios ---
// Ratio ranges for calories/macros depending on the meal
const mealLowerRatios = { breakfast: 0.15, lunch: 0.2, dinner: 0.3 };
const mealUpperRatios = { breakfast: 0.4, lunch: 0.5, dinner: 0.6 };

// --- Preference Lists ---
// Fields treated as text inputs
const stringPreferences = ['diet', 'cuisine', 'excludeIngredients', 'intolerance'];
// Fields treated as numeric inputs (duplicated to match "min" and "max" structure)
const numericPreferences = ['Protein', 'Calories', 'Carbs', 'Fat'];

// --- API Functions ---

// Connect user (currently unused / in progress)
async function connectUser(user) {
    let apiCall = `${baseApi}/users/connect?apiKey=${apiKey}`;
    try {
        const response = await fetch(apiCall);
        const data = await response.json();
        if (checkApiFailure(data)) return null;
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

// Generate a meal plan based on user preferences
async function generateMealPlan(preferences, timeFrame) {
    let apiCall = `${baseApi}//mealplanner/generate?apiKey=${apiKey}&timeFrame=${timeFrame}`;

    // Dynamically build URL with user preferences
    if (preferences['diet']) {
        apiCall += `&${encodeURIComponent('diet')}=${encodeURIComponent(preferences['diet'])}`;
    }
    if (preferences['minCalories'] && preferences['maxCalories']) {
        const target = (preferences['minCalories'] + preferences['maxCalories']) / 2;
        apiCall += `&${encodeURIComponent('targetCalories')}=${encodeURIComponent(target)}`;
    }
    if (preferences['intolerances']) {
        apiCall += `&${encodeURIComponent('intolerances')}=${encodeURIComponent(preferences['intolerances'])}`;
    }

    try {
        const response = await fetch(apiCall);
        const data = await response.json();
        if (checkApiFailure(data)) return null;

        // Fix image paths for each meal
        for (const day in data.week) {
            for (const mealType in data.week[day].meals) {
                const meal = data.week[day].meals[mealType];
                if (meal && meal.image) {
                    meal.image = `https://spoonacular.com/recipeImages/${meal.image}`;
                }
            }
        }

        return data.week;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

// Get detailed recipe info from a list of IDs
async function getRecipesByIds(weeklyPlan) {
    const ids = Object.values(weeklyPlan).flatMap(day => Object.values(day));
    const apiCall = `${baseApi}/recipes/informationBulk?apiKey=${apiKey}&ids=${ids.join(',')}&includeNutrition=true`;

    try {
        const response = await fetch(apiCall);
        const recipes = await response.json();
        if (checkApiFailure(recipes)) return null;

        // Map recipes by ID
        const recipeMap = {};
        for (const recipe of recipes) {
            recipeMap[recipe.id] = recipe;
        }

        // Build structured meal plan
        const structuredPlan = {};
        for (const [day, meals] of Object.entries(weeklyPlan)) {
            structuredPlan[day] = { meals: [] };

            // Insert recipes into the day
            for (const mealType of ['breakfast', 'lunch', 'dinner']) {
                const mealId = meals[mealType];
                structuredPlan[day].meals.push(recipeMap[mealId] || null);
            }

            // Calculate daily nutrient totals
            let totalCalories = 0, totalCarbs = 0, totalFat = 0, totalProtein = 0;
            for (const recipe of structuredPlan[day].meals) {
                if (recipe && recipe.nutrition && recipe.nutrition.nutrients) {
                    for (const nutrient of recipe.nutrition.nutrients) {
                        const name = nutrient.name.toLowerCase();
                        const amount = nutrient.amount;
                        if (name.includes('calories')) totalCalories += amount;
                        if (name.includes('carbohydrates')) totalCarbs += amount;
                        if (name.includes('fat')) totalFat += amount;
                        if (name.includes('protein')) totalProtein += amount;
                    }
                }
            }

            // Store nutrient summary
            structuredPlan[day]['nutrients'] = {
                calories: parseFloat(totalCalories.toFixed(2)),
                carbohydrates: parseFloat(totalCarbs.toFixed(2)),
                fat: parseFloat(totalFat.toFixed(2)),
                protein: parseFloat(totalProtein.toFixed(2)),
            };
        }

        return structuredPlan;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

// Search for recipes based on preferences for a specific meal
async function recipeSearch(preferences, meal) {
    const minRatio = mealLowerRatios[meal.toLowerCase()] || 0.33;
    const maxRatio = mealUpperRatios[meal.toLowerCase()] || 0.5;
    const adjustedPrefs = {};

    // Adjust string preferences
    stringPreferences.forEach((key) => {
        if (preferences[key]) adjustedPrefs[key] = preferences[key];
    });

    // Adjust numeric preferences by meal ratios
    numericPreferences.forEach((key) => {
        const minKey = 'min' + key;
        if (typeof preferences[minKey] === 'number') adjustedPrefs[minKey] = Math.round(preferences[minKey] * minRatio);
        const maxKey = 'max' + key;
        if (typeof preferences[maxKey] === 'number') adjustedPrefs[maxKey] = Math.round(preferences[maxKey] * maxRatio);
    });

    // Build query URL
    let apiCall = `${baseApi}/recipes/complexSearch?apiKey=${apiKey}&addRecipeInformation=true`;
    for (let key in adjustedPrefs) {
        apiCall += `&${encodeURIComponent(key)}=${encodeURIComponent(adjustedPrefs[key])}`;
    }

    try {
        const response = await fetch(apiCall);
        const data = await response.json();
        if (checkApiFailure(data)) return null;

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

// Build a preferences form dynamically
function getPreferencesForm(formId, executeFct) {
  let preferencesForm = document.getElementById(formId)

  preferencesForm.innerHTML = `
        <form class="preferenceForm">
            <h2>General Meal Preferences</h2>

            <div class="form-group">
                <label>What meal is this?: 
                    <select name="meal">
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                    </select>
                </label>
            </div>

            <div class="form-group">
                <label>Cuisines (comma-separated):</label>
                <input type="text" name="cuisine">
            </div>

            <div class="form-group">
                <label>Exclude Ingredients (comma-separated):</label>
                <input type="text" name="excludeIngredients">
            </div>

            <div class="form-group">
                <label>Intolerance (comma-separated):</label>
                <input type="text" name="intolerance">
            </div>

            <h2>Daily Nutrition Preferences</h2>

            <div class="min-max-group">
                <label>Protein:
                    <input type="number" name="minProtein" placeholder="Min">
                    <input type="number" name="maxProtein" placeholder="Max">
                </label>
            </div>

            <div class="min-max-group">
                <label>Calories:
                    <input type="number" name="minCalories" placeholder="Min">
                    <input type="number" name="maxCalories" placeholder="Max">
                </label>
            </div>

            <div class="min-max-group">
                <label>Carbs:
                    <input type="number" name="minCarbs" placeholder="Min">
                    <input type="number" name="maxCarbs" placeholder="Max">
                </label>
            </div>

            <div class="min-max-group">
                <label>Fat:
                    <input type="number" name="minFat" placeholder="Min">
                    <input type="number" name="maxFat" placeholder="Max">
                </label>
            </div>

            <div class="submit-wrapper">
                <button type="submit" class="submit-btn">Search Recipes</button>
            </div>
        </form>
    `

    preferencesForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const meal = formData.get('meal');
        const preferences = {};

        // Gather user input into preferences object
        stringPreferences.forEach((key) => {
            const value = formData.get(key);
            if (value) preferences[key] = value;
        });
        numericPreferences.forEach((key) => {
            const minKey = 'min' + key;
            const value = parseFloat(formData.get(minKey));
            if (!isNaN(value)) preferences[minKey] = value;

            const maxKey = 'max' + key;
            const value2 = parseFloat(formData.get(maxKey));
            if (!isNaN(value2)) preferences[maxKey] = value2;
        });

        executeFct(preferences, meal);
    });
}

// Create a recipe card element with "See More" and "Add to Favorites" functionality
async function createRecipeCard(recipe, addMealPlan) {
    const recipeCard = document.createElement('div');
    recipeCard.classList.add('recipe-card');

    recipeCard.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="details">
            <h3>${recipe.title}</h3>
        </div>
        <div class="action-buttons">
            <button class="see-more">See More</button>
            <button class="favorite">Add to Favorites</button>
        </div>
    `;

    // Add "Add to Meal Plan" button if necessary
    if (addMealPlan) addMealPlanBtn(recipeCard, recipe);

    // Handle "See More" click to open source URL
    const seeMoreBtn = recipeCard.querySelector('.see-more');
    seeMoreBtn.addEventListener('click', () => {
        window.open(recipe.sourceUrl, '_blank');
    });

    // Handle "Favorite" button setup
    const favBtn = recipeCard.querySelector('.favorite');
    try {
        const response = await fetch('/check-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipeId: recipe.id,
                userId: localStorage.userId
            })
        });
        if (!response.ok) throw new Error("Could not load preferences.");
        const result = await response.json();
        favBtn.textContent = result.isFavorite ? 'Remove from Favorites' : 'Add to Favorites';

        // Toggle favorite status on click
        favBtn.addEventListener('click', async () => {
            try {
                const changeResponse = await fetch('/change-favorite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipeId: recipe.id,
                        userId: localStorage.userId
                    })
                });
                if (!changeResponse.ok) throw new Error("Failed to update favorites.");
                const changeResult = await changeResponse.json();
                favBtn.textContent = changeResult.isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
            } catch (err) {
                console.error(err);
                alert("Could not update favorites.");
            }
        });
    } catch (err) {
        console.error(err);
        alert("Could not load preferences.");
    }

    return recipeCard;
}

// Add "Add to Meal Plan" button functionality to a recipe card
function addMealPlanBtn(recipeCard, recipe) {
    const actionButtons = recipeCard.querySelector('.action-buttons');
    const mealPlanBtn = document.createElement('button');
    mealPlanBtn.classList.add('add_to_plan');
    mealPlanBtn.textContent = 'Add to Meal Plan';

    // Prompt user for day and meal type to add the recipe
    mealPlanBtn.addEventListener('click', async () => {
        const day = prompt("Which day of the week would you like to add this meal to?\n(Monday, Tuesday, etc.)");
        if (!day || !['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(day.toLowerCase())) {
            alert("Please enter a valid day of the week.");
            return;
        }
        const mealType = prompt("Which meal would you like to replace?\n(Breakfast, Lunch, or Dinner)");
        if (!mealType || !['breakfast','lunch','dinner'].includes(mealType.toLowerCase())) {
            alert("Please enter a valid meal type.");
            return;
        }

        // Update the meal plan server-side
        try {
            const response = await fetch('/swap-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipeId: recipe.id,
                    userId: localStorage.userId,
                    day: day.toLowerCase(),
                    mealType: mealType.toLowerCase()
                })
            });
            if (!response.ok) throw new Error("Failed to update meal plan.");
            const result = await response.json();
            alert(`Meal successfully added to your ${mealType} on ${day}!`);
        } catch (err) {
            console.error(err);
            alert("Could not update meal plan.");
        }
    });

    actionButtons.appendChild(mealPlanBtn);
}

// Generate multiple recipe cards at once
async function generateRecipeCards(recipeIds, container) {
    const apiCall = `${baseApi}/recipes/informationBulk?apiKey=${apiKey}&ids=${recipeIds.join(',')}&includeNutrition=true`;

    try {
        const response = await fetch(apiCall);
        const recipes = await response.json();
        if (checkApiFailure(recipes)) return null;

        for (const recipe of recipes) {
            const recipeCard = await createRecipeCard(recipe, true);
            const favBtn = recipeCard.querySelector('.favorite');
            if (favBtn) {
                favBtn.addEventListener('click', async () => {
                    setTimeout(() => {
                        if (favBtn.textContent.trim().toLowerCase() === 'add to favorites') {
                            recipeCard.remove();
                        }
                    }, 200);
                });
            }
            container.appendChild(recipeCard);
        }
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

// Helper to detect if the Spoonacular API response was an error
function checkApiFailure(response) {
    if (response.status === "failure") {
        console.error(`API failure detected: ${response.message || "Unknown error"}`);
        switch (response.code) {
            case 402: alert("API limit reached: " + response.message); break;
            case 400: alert("Bad request: " + response.message); break;
            case 401: alert("Unauthorized access: " + response.message); break;
            case 404: alert("Resource not found: " + response.message); break;
            case 500: alert("Server error: " + response.message); break;
            case 503: alert("Service unavailable: " + response.message); break;
            default: alert("An error occurred: " + response.message);
        }
        return true;
    }
    return false;
}
