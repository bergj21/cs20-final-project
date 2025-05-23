const express = require('express')
const { connectToUsersCollection, disconnectDB } = require('./database.js')
const routes = require('./routes.js')

const app = express()
const PORT = process.env.PORT || 3000

// ONLY force HTTPS if in production (on Heroku)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Static files and body parsing
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Starts the server and connects to the database
async function startServer() {
  try {
    let usersCollection = await connectToUsersCollection()
    app.locals.users = usersCollection

    app.use('/', routes)

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down server...')
  await disconnectDB()
  process.exit(0)
})

startServer()
