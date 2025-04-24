const express = require('express')
const router = express.Router()
const { loginUser } = require('./authorize.js')
const {
  getUserPreferences,
  getUser,
  saveWeeklyMealPlan,
  checkFavorite,
  changeFavorite,
  swapMeal
} = require('./database.js')

// POST /login
router.post('/login', loginUser)

// retrieves the user preferences
router.get('/get-user-preferences', getUserPreferences)

// retrieves a single user
router.get('/get-user', getUser)

// saves a weekly meal plan to user
router.post('/save-weekly-plan', saveWeeklyMealPlan)

// checks if a recipe id is saved in the user's favorites
router.post('/check-favorite', checkFavorite)

// adds or removes a recipe from the user's favorites list
router.post('/change-favorite', changeFavorite)

// swaps a meal in the meal plan
router.post('/swap-meal', swapMeal);

module.exports = router
