import express from "express";
import User from "../models/User.js";
import { generateAuthToken, authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      username,
      email,
      password
    });

    await user.save();
    const token = generateAuthToken(user);

    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateAuthToken(user);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user profile
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("boards", "name description");
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.patch("/profile", authenticateUser, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["username", "email", "profile.displayName", "profile.bio"];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: "Invalid updates" });
  }

  try {
    updates.forEach(update => {
      if (update.includes(".")) {
        const [parent, child] = update.split(".");
        req.user[parent][child] = req.body[update];
      } else {
        req.user[update] = req.body[update];
      }
    });

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user settings
router.patch("/settings", authenticateUser, async (req, res) => {
  try {
    req.user.settings = { ...req.user.settings, ...req.body };
    await req.user.save();
    res.json(req.user.settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 