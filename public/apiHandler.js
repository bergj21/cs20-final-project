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
    let apiCall = `${baseApi}/recipes/complexSearch?apiKey=${apiKey}&addRecipeNutrition=true`;
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
        <h3>General Meal Preferences</h3>
        <label>Cuisines (comma-separated): <input type="text" name="cuisine"></label>
        <label>Exclude Ingredients (comma-separated): <input type="text" name="excludeIngredients"></label>
        <label>Intolerance (comma-separated): <input type="text" name="intolerance"></label>

        <h3>Daily Nutrition Preferences</h3>
        <label>Minimum Protein: <input type="number" name="minProtein"></label>
        <label>Maximum Protein: <input type="number" name="maxProtein"></label>
        <label>Minimum Calories: <input type="number" name="minCalories"></label>
        <label>Maximum Calories: <input type="number" name="maxCalories"></label>
        <label>Minimum Carbs: <input type="number" name="minCarbs"></label>
        <label>Maximum Carbs: <input type="number" name="maxCarbs"></label>
        <label>Minimum Fat: <input type="number" name="minFat"></label>
        <label>Maximum Fat: <input type="number" name="maxFat"></label>

        <label>Meal:
        <select name="meal">
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
        </select>
        </label>

        <button type="submit">Search Recipes</button>
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