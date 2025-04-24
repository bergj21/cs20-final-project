// authorize.js

// Log in an existing user
async function loginUser(req, res) {
    const { email, password } = req.body;
    const usersCollection = req.app.locals.users;
  
    try {
      const user = await usersCollection.findOne({ email });
      if (!user || user.password !== password) {
        return res.status(401).send('Invalid email or password');
      }
      // Return userId so the client can store it
      res.json({ userId: user._id });
    } catch (err) {
      console.error("Error logging in:", err);
      res.status(500).send('Server error');
    }
  }
  
  // Sign up a new user *with* preferences, only storing fields the user actually filled
  async function signupUser(req, res) {
    console.log('signupUser payload:', req.body);
    const { name, email, password, preferences = {} } = req.body;
    const usersCollection = req.app.locals.users;
  
    try {
      // Prevent duplicate emails
      const existing = await usersCollection.findOne({ email });
      if (existing) {
        return res.status(409).send('Email already registered');
      }
  
      // Dynamically build preferences object
      const userPrefs = {};
  
      // String-based preferences
      ['intolerances', 'cuisine', 'excludeIngredients'].forEach(key => {
        const val = preferences[key];
        if (typeof val === 'string' && val.trim() !== '') {
          userPrefs[key] = val.trim();
        }
      });
  
      // Numeric preferences
      [
        'minCalories', 'maxCalories',
        'minCarbs',    'maxCarbs',
        'minFat',      'maxFat',
        'minProtein',  'maxProtein'
      ].forEach(key => {
        const val = preferences[key];
        if (val !== undefined && val !== '' && !isNaN(Number(val))) {
          userPrefs[key] = Number(val);
        }
      });
  
      // Assemble new user document
      const newUser = {
        name,
        email,
        password,
        preferences: userPrefs,
        weeklyPlan: [],   // start empty
        favorites: []     // start empty
      };
  
      // Insert into MongoDB
      const result = await usersCollection.insertOne(newUser);
      res.status(201).json({ userId: result.insertedId });
    } catch (err) {
      console.error("Error signing up:", err);
      res.status(500).send('Server error');
    }
  }
  
  module.exports = {
    loginUser,
    signupUser
  };
  
  
  
