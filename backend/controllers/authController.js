const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Shop = require('../models/shopSchema');

require('dotenv').configure()

const JWT_SECRET = process.env.JWT_SECRET; 


exports.registerShop = async (req, res) => {
    const { name, owner, email, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new shop
        const shop = new Shop({
            name,
            owner,
            email,
            password: hashedPassword
        });

        const savedShop = await shop.save();
        res.status(201).json(savedShop);
    } catch (error) {
        res.status(500).json({ message: 'Error registering shop', error });
    }
};

// Login Shop
exports.loginShop = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if shop exists
        const shop = await Shop.findOne({ email });
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, shop.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign({ shopId: shop._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};
