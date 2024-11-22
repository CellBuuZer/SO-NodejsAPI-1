const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importing CORS

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

// Schema & Model for Users
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
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

// User registration (Create User)
app.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'fcd791f14f261669681a54437e5364b6b3e6612dd26ce0cc5b4dea8eda01411f09cede3f905ae58a6a763c0f3b344909a791fb9c06755f654e1007929931fcd3', { expiresIn: '1h' });

    // Send response with token and user info
    res.status(201).json({
      message: 'User created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

// User login (Login User)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'fcd791f14f261669681a54437e5364b6b3e6612dd26ce0cc5b4dea8eda01411f09cede3f905ae58a6a763c0f3b344909a791fb9c06755f654e1007929931fcd3', { expiresIn: '1h' });

    // Send response with token and user info
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error during login', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
