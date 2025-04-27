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

let usersCollection;

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
  const weeklyPlan = req.body.weeklyPlan
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

async function checkFavorite(req, res)
{
    const { recipeId, userId } = req.body;

    if (!recipeId || !userId) {
        return res.status(400).json({ error: 'Missing recipeId or userId' });
    }

    try {
        if (!usersCollection) {
            await connectToUsersCollection()
        }
    
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    
        if (!user) {
            res.status(404).json({ error: 'User not found' })
        }
    
        const isFavorite = user.favorites && user.favorites.includes(recipeId);
        res.json({ isFavorite });
    } catch (err) {
        console.error('Error retrieving user preferences:', err)
        res.status(500).json({ error: 'Server error' })
    }
}

async function changeFavorite(req, res) {
    const { recipeId, userId } = req.body;

    if (!recipeId || !userId) {
        return res.status(400).json({ error: 'Missing recipeId or userId' });
    }

    try {
        if (!usersCollection) {
            await connectToUsersCollection();
        }

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let update;
        let updatedToFavorite;

        if (!user.favorites) {
            // Initialize favorites with recipeId
            update = { $set: { favorites: [recipeId] } };
            updatedToFavorite = true;
        } else if (user.favorites.includes(recipeId)) {
            // Remove recipeId from favorites
            update = { $pull: { favorites: recipeId } };
            updatedToFavorite = false;
        } else {
            // Add recipeId to favorites
            update = { $addToSet: { favorites: recipeId } };
            updatedToFavorite = true;
        }

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) }, update
        );

        res.json({ success: true, isFavorite: updatedToFavorite });
    } catch (err) {
        console.error('Error updating favorite status:', err);
        res.status(500).json({ error: 'Server error' });
    }
}


async function swapMeal(req, res) {
    const { recipeId, userId, day, mealType } = req.body;

    if (!recipeId || !userId || !day || !mealType) {
        return res.status(400).json({ error: 'Missing recipeId, userId, day, or mealType' });
    }

    try {
        if (!usersCollection) {
            await connectToUsersCollection();
        }

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build the field path dynamically for nested update
        const fieldPath = `weeklyPlan.${day}.${mealType}`;

        // Update the nested field with the new recipeId
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { [fieldPath]: recipeId } }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating meal plan:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

async function getFavorites(req, res) {
    const userId = req.query.userId
    try {
        if (!usersCollection) {
            await connectToUsersCollection()
        }

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

        if (!user) {
            res.status(404).json({ error: 'User not found' })
        }

        res.json(user.favorites)
    } catch (err) {
        console.error('Error retrieving user preferences:', err)
        res.status(500).json({ error: 'Server error' })
    }
}


module.exports = {
  connectToUsersCollection,
  disconnectDB,
  getUserPreferences,
  getUser,
  saveWeeklyMealPlan,
  checkFavorite,
  changeFavorite,
  swapMeal,
  getFavorites
}
