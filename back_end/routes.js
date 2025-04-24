const express = require('express')
const router = express.Router()
const { loginUser } = require('./authorize.js')
const {
  getUserPreferences,
  getUser,
  saveWeeklyMealPlan,
} = require('./database.js')

// POST /login
router.post('/login', loginUser)

// retrieves the user preferences
router.get('/get-user-preferences', getUserPreferences)

// retrieves a single user
router.get('/get-user', getUser)

// saves a weekly meal plan to user
router.post('/save-weekly-plan', saveWeeklyMealPlan)

module.exports = router
