const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importing CORS
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const jwt = require('jsonwebtoken'); // Import JSON Web Token for authentication

const app = express();
app.use(bodyParser.json());

// Enable CORS for all origins (you can adjust it to specific origins later)
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://18.117.121.144:27017/GastroGoDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000
}).then(() => console.log("MongoDB connected")).catch(err => console.log(err));

// JWT Secret
const JWT_SECRET = 'fcd791f14f261669681a54437e5364b6b3e6612dd26ce0cc5b4dea8eda01411f09cede3f905ae58a6a763c0f3b344909a791fb9c06755f654e1007929931fcd3'; // Replace with a strong secret key

// Schema & Model for Users
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Schema & Model for Restaurants
const RestaurantSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  email: String,
  cuisine: String,
  rating: { type: Number, min: 0, max: 5 },
  createdAt: { type: Date, default: Date.now }
});
const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

// =====================
// Authentication Endpoints
// =====================

// Signup (Register a new user)
app.post('/users/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    res.status(201).send({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Login (Authenticate a user)
app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    // Check if the password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({ message: 'Login successful', token });
  } catch (err) {
    res.status(400).send(err);
  }
});

// =====================
// CRUD Endpoints for Restaurants
// =====================

// Create a restaurant
app.post('/restaurants', async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.status(201).send(restaurant);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get all restaurants
app.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.send(restaurants);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Update a restaurant
app.put('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(restaurant);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Delete a restaurant
app.delete('/restaurants/:id', async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.send({ message: 'Restaurant deleted' });
  } catch (err) {
    res.status(400).send(err);
  }
});

// =====================
// Middleware for Authentication
// =====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Example: Protecting an endpoint
app.get('/protected', authenticateToken, (req, res) => {
  res.send({ message: 'You have access to this protected route', user: req.user });
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
