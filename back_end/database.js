const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const db_username = 'meal_prep_buddy'
const db_password = 'Xbl6ZVWIwePsELZY'
const uri = `mongodb+srv://${db_username}:${db_password}@alexshriver.xg4npfv.mongodb.net/?appName=AlexShriver`

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

let usersCollection

async function connectToUsersCollection() {
  try {
    await client.connect()
    const db = client.db('meal_prep_buddy')
    usersCollection = db.collection('users')
    console.log('Connected to MongoDB and users collection.')
    return usersCollection
  } catch (err) {
    console.error('MongoDB connection error:', err)
    throw err
  }
}

async function disconnectDB() {
  try {
    await client.close()
    console.log('Disconnected from MongoDB.')
  } catch (err) {
    console.error('Error disconnecting:', err)
  }
}

async function getUserPreferences(req, res) {
  const userId = req.query.userId
  try {
    if (!usersCollection) {
      await connectToUsersCollection()
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
    }

    res.json(user.preferences)
  } catch (err) {
    console.error('Error retrieving user preferences:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

async function getUser(req, res) {
  const userId = req.query.userId
  try {
    if (!usersCollection) {
      await connectToUsersCollection()
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (err) {
    console.error('Error retrieving user preferences:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

async function saveWeeklyMealPlan(req, res) {
  const userId = req.body.userId
  const weeklyPlan = req.body.weeklyPlan?.week
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

  const formattedPlan = {}

  days.forEach((day) => {
    const dayPlan = weeklyPlan[day]
    if (!dayPlan || !Array.isArray(dayPlan.meals)) {
      formattedPlan[day] = { breakfast: null, lunch: null, dinner: null }
      return
    }

    const [breakfast, lunch, dinner] = dayPlan.meals
    formattedPlan[day] = {
      breakfast: breakfast?.id || null,
      lunch: lunch?.id || null,
      dinner: dinner?.id || null,
    }
  })

  if (!usersCollection) {
    await connectToUsersCollection()
  }

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { weeklyPlan: formattedPlan } }
    )

    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }
    res
      .status(200)
      .json({ message: 'Meal plan saved', weeklyPlan: formattedPlan })
  } catch (error) {
    console.error('Error saving meal plan:', error)
    res.status(500).json({ message: 'Failed to save meal plan' })
  }

  return formattedPlan
}

module.exports = {
  connectToUsersCollection,
  disconnectDB,
  getUserPreferences,
  getUser,
  saveWeeklyMealPlan,
}
