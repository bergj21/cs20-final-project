const apiKey = "e075ef7a95604de8b1003d3e56d3b078";
const baseApi = "https://api.spoonacular.com";

const mealRatios = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.4
};

const stringPreferences = ['cuisine', 'excludeIngredients', 'intolerance'];
const numericPreferences = ['minProtein', 'maxProtein', 'minCalories', 
                            'maxCalories', 'minCarbs', 'maxCarbs',
                            'minFat', 'maxFat']

async function recipeSearch(preferences, meal)
{
    // Adjust the preferences for the meal
    const ratio = mealRatios[meal.toLowerCase()] || 0.33;
    const adjustedPrefs = {};

    stringPreferences.forEach(key => {
        if (preferences[key]) {
            adjustedPrefs[key] = preferences[key];
        }
    });

    numericPreferences.forEach(key => {
        if (typeof preferences[key] === 'number') {
          adjustedPrefs[key] = Math.round(preferences[key] * ratio);
        }
    });

    // Create the API URL call
    let apiCall = `${baseApi}/recipes/complexSearch?apiKey=${apiKey}`;
    for (let key in adjustedPrefs)
    {
        apiCall += `&${encodeURIComponent(key)}=${encodeURIComponent(adjustedPrefs[key])}`;
    }

    console.log(apiCall);

    // Fetch the data from the API
    try {
        const response = await fetch(apiCall);
        const data = await response.json();
    
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

function getPreferencesForm(formId, executeFct)
{
    let preferencesForm = document.getElementById(formId);

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
    `;


    preferencesForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const meal = formData.get('meal');
        const preferences = {};

        stringPreferences.forEach(key => {
            const value = formData.get(key);
            if (value) preferences[key] = value;
        });

        numericPreferences.forEach(key => {
            const value = parseFloat(formData.get(key));
            if (!isNaN(value)) preferences[key] = value;
        });

        executeFct(preferences, meal);
    });    
}