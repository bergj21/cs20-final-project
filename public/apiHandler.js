// const apiKey = '5fffdd1ef2284ee7b1b869e03538f404'
const apiKey = 'e075ef7a95604de8b1003d3e56d3b078'
// const apiKey = '00a2d2dbfecf4a8e82423a2f8415ac88'
// const apiKey = '258415058f10403486235ffa1cac1851' 
const baseApi = 'https://api.spoonacular.com'

const mealLowerRatios = {
  breakfast: 0.15,
  lunch: 0.2,
  dinner: 0.3,
}

const mealUpperRatios = {
  breakfast: 0.4,
  lunch: 0.5,
  dinner: 0.6,
}

const stringPreferences = [
  'diet',
  'cuisine',
  'excludeIngredients',
  'intolerance',
]
const numericPreferences = [
  'Protein',
  'Protein',
  'Calories',
  'Calories',
  'Carbs',
  'Carbs',
  'Fat',
  'Fat',
]

// in progress
async function connectUser(user) {
    let apiCall = `${baseApi}/users/connect?apiKey=${apiKey}`;
    try {
        const response = await fetch(apiCall);
        const data = await response.json();

        if (checkApiFailure(data)) return null; // Check API limit

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

async function generateMealPlan(preferences, timeFrame) {
    let apiCall = `${baseApi}//mealplanner/generate?apiKey=${apiKey}&timeFrame=${timeFrame}`;

    // Add diet if it exists
    if (preferences['diet']) {
        apiCall += `&${encodeURIComponent('diet')}=${encodeURIComponent(preferences['diet'])}`;
    }

    // Add targetCalories if minCalories and maxCalories exist
    if (preferences['minCalories'] && preferences['maxCalories']) {
        const target = (preferences['minCalories'] + preferences['maxCalories']) / 2;
        apiCall += `&${encodeURIComponent('targetCalories')}=${encodeURIComponent(target)}`;
    }

    // Add intolerances if they exist
    if (preferences['intolerances']) {
        apiCall += `&${encodeURIComponent('intolerances')}=${encodeURIComponent(preferences['intolerances'])}`;
    }

    try {
        const response = await fetch(apiCall);
        const data = await response.json();

        if (checkApiFailure(data)) return null; // Check API limit

        // Update image URLs for each meal in data.week
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

async function getRecipesByIds(weeklyPlan) {
    const ids = Object.values(weeklyPlan).flatMap(day => Object.values(day));
    const apiCall = `${baseApi}/recipes/informationBulk?apiKey=${apiKey}&ids=${ids.join(',')}&includeNutrition=true`;
    try {
        const response = await fetch(apiCall);
        const recipes = await response.json();

        if (checkApiFailure(recipes)) return null; // Check API limit
        // Map recipe IDs to recipe objects
        const recipeMap = {};
        for (const recipe of recipes) {
            recipeMap[recipe.id] = recipe;
        }
        // Rebuild the weekly plan
        const structuredPlan = {};

        for (const [day, meals] of Object.entries(weeklyPlan)) {
            structuredPlan[day] = { meals: [] }; // Initialize meals array for this day

            // Store the meals into the meals array
            for (const mealType of ['breakfast', 'lunch', 'dinner']) {
                const mealId = meals[mealType];
                const recipe = recipeMap[mealId] || null;
                structuredPlan[day].meals.push(recipe);
            }

            // Now calculate nutrients
            let totalCalories = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            let totalProtein = 0;

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

            structuredPlan[day]['nutrients'] = {
                calories: parseFloat(totalCalories.toFixed(2)),
                carbohydrates: parseFloat(totalCarbs.toFixed(2)),
                fat: parseFloat(totalFat.toFixed(2)),
                protein: parseFloat(totalProtein.toFixed(2))
            };
        }

        return structuredPlan;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

async function recipeSearch(preferences, meal) {
    // Adjust the preferences for the meal
    const minRatio = mealLowerRatios[meal.toLowerCase()] || 0.33;
    const maxRatio = mealUpperRatios[meal.toLowerCase()] || 0.5;
    const adjustedPrefs = {};

    stringPreferences.forEach((key) => {
        if (preferences[key]) {
            adjustedPrefs[key] = preferences[key];
        }
    });

    numericPreferences.forEach((key) => {
        minKey = 'min' + key;
        if (typeof preferences[minKey] === 'number') {
            adjustedPrefs[minKey] = Math.round(preferences[minKey] * minRatio);
        }
        maxKey = 'max' + key;
        if (typeof preferences[maxKey] === 'number') {
            adjustedPrefs[maxKey] = Math.round(preferences[maxKey] * maxRatio);
        }
    });

    // Create the API URL call
    let apiCall = `${baseApi}/recipes/complexSearch?apiKey=${apiKey}&addRecipeInformation=true`;
    for (let key in adjustedPrefs) {
        apiCall += `&${encodeURIComponent(key)}=${encodeURIComponent(adjustedPrefs[key])}`;
    }

    // Fetch the data from the API
    try {
        const response = await fetch(apiCall);
        const data = await response.json();

        if (checkApiFailure(data)) return null; // Check API limit

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

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
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const meal = formData.get('meal')
    const preferences = {}

    stringPreferences.forEach((key) => {
      const value = formData.get(key)
      if (value) preferences[key] = value
    })

    numericPreferences.forEach((key) => {
      const minKey = 'min' + key
      const value = parseFloat(formData.get(minKey))
      if (!isNaN(value)) preferences[minKey] = value

      const maxKey = 'max' + key
      const value2 = parseFloat(formData.get(maxKey))
      if (!isNaN(value2)) preferences[maxKey] = value2
    })

    executeFct(preferences, meal)
  })
}

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

    // Add "Add to Meal Plan" button conditionally
    if (addMealPlan) addMealPlanBtn(recipeCard, recipe);

    // "See More" click
    const seeMoreBtn = recipeCard.querySelector('.see-more');
    seeMoreBtn.addEventListener('click', () => {
        window.open(recipe.sourceUrl, '_blank');
    });

    // Favorite button logic
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

function addMealPlanBtn(recipeCard, recipe) {
    const actionButtons = recipeCard.querySelector('.action-buttons');
    const mealPlanBtn = document.createElement('button');
    mealPlanBtn.classList.add('add_to_plan');
    mealPlanBtn.textContent = 'Add to Meal Plan';

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

async function generateRecipeCards(recipeIds, container) {
    const apiCall = `${baseApi}/recipes/informationBulk?apiKey=${apiKey}&ids=${recipeIds.join(',')}&includeNutrition=true`;

    try {
        const response = await fetch(apiCall);
        const recipes = await response.json(); 

        if (checkApiFailure(recipes)) return null; // Check API limit
        
        for (const recipe of recipes) {
            const recipeCard = await createRecipeCard(recipe, true);

            // Look for the "favorite" button inside the created card
            const favBtn = recipeCard.querySelector('.favorite');

            if (favBtn) {
                favBtn.addEventListener('click', async () => {
                    // After a short delay, check if it was removed
                    setTimeout(() => {
                        if (favBtn.textContent.trim().toLowerCase() === 'add to favorites') {
                            // If the user removed it, remove the card from the container
                            recipeCard.remove();
                        }
                    }, 200); // small delay to let server update button text
                });
            }

            container.appendChild(recipeCard);
        }
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

function checkApiFailure(response) {
    if (response.status === "failure") {
        console.error(`API failure detected: ${response.message || "Unknown error"}`);
        
        // Handle specific error codes
        switch (response.code) {
            case 402:
                alert("API limit reached: " + response.message);
                break;
            case 400:
                alert("Bad request: " + response.message);
                break;
            case 401:
                alert("Unauthorized access: " + response.message);
                break;
            case 404:
                alert("Resource not found: " + response.message);
                break;
            case 500:
                alert("Server error: " + response.message);
                break;
            case 503:
                alert("Service unavailable: " + response.message);
                break;
            default:
                alert("An error occurred: " + response.message);
        }

        return true; // Indicate that a failure was detected
    }

    return false; // No failure detected
}


