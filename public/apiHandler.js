const apiKey = '5fffdd1ef2284ee7b1b869e03538f404'
const baseApi = 'https://api.spoonacular.com'

const mealRatios = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.4,
}

const stringPreferences = [
  'diet',
  'cuisine',
  'excludeIngredients',
  'intolerance',
]
const numericPreferences = [
  'minProtein',
  'maxProtein',
  'minCalories',
  'maxCalories',
  'minCarbs',
  'maxCarbs',
  'minFat',
  'maxFat',
]

// in progress
async function connectUser(user) {
  let apiCall = `${baseApi}/users/connect?apiKey=${apiKey}`
  try {
    const response = await fetch(apiCall)
    const data = await response.json()

    return data
  } catch (error) {
    console.error('API call failed:', error)
    return null
  }
}

async function generateMealPlan(preferences, timeFrame) {
  let apiCall = `${baseApi}//mealplanner/generate?apiKey=${apiKey}&timeFrame=${timeFrame}`
  apiCall += `&${encodeURIComponent('diet')}=${encodeURIComponent(
    preferences['diet']
  )}`
  target = (preferences['minCalories'] + preferences['maxCalories']) / 2
  apiCall += `&${encodeURIComponent('targetCalories')}=${encodeURIComponent(
    target
  )}`
  apiCall += `&${encodeURIComponent('intolerances')}=${encodeURIComponent(
    preferences['intolerances']
  )}`

  try {
    const response = await fetch(apiCall)
    const data = await response.json()

    return data
  } catch (error) {
    console.error('API call failed:', error)
    return null
  }
}

async function getMealById(id) {
  let apiCall = `${baseApi}/recipes/${id}/information?apiKey=${apiKey}`

  try {
    const response = await fetch(apiCall)
    const recipe = await response.json()

    return recipe
  } catch (error) {
    console.error('API call failed:', error)
    return null
  }
}

async function recipeSearch(preferences, meal) {
  // Adjust the preferences for the meal
  const ratio = mealRatios[meal.toLowerCase()] || 0.33
  const adjustedPrefs = {}

  stringPreferences.forEach((key) => {
    if (preferences[key]) {
      adjustedPrefs[key] = preferences[key]
    }
  })

  numericPreferences.forEach((key) => {
    if (typeof preferences[key] === 'number') {
      adjustedPrefs[key] = Math.round(preferences[key] * ratio)
    }
  })

  // Create the API URL call
  let apiCall = `${baseApi}/recipes/complexSearch?apiKey=${apiKey}&addRecipeInformation=true`
  for (let key in adjustedPrefs) {
    apiCall += `&${encodeURIComponent(key)}=${encodeURIComponent(
      adjustedPrefs[key]
    )}`
  }

  console.log(apiCall);

  // Fetch the data from the API
  try {
    const response = await fetch(apiCall)
    const data = await response.json()

    return data
  } catch (error) {
    console.error('API call failed:', error)
    return null
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
      const value = parseFloat(formData.get(key))
      if (!isNaN(value)) preferences[key] = value
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
