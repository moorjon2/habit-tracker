require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {response, request} = require("express");
const Habit = require('./models/habit');
const errorHandler = require('./middleware/errorHandler')

const app = express();

// --- MongoDB Connection ---
mongoose.set('strictQuery', false);
const mongoUrl = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
mongoose.connect(mongoUrl)
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error.message);
    });

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(errorHandler);

// --- Health Check Route ---
app.get('/api/health', (request, response) => {
    response.send({ status: 'ok' });
});

// GET all habits
app.get('/api/habits', (request, response, next) => {
    Habit.find({})
        .then(habits => {
            response.json(habits);
        })
        .catch(error => next(error));
});

// PATCH a habit, adds a date to the logs
app.patch('/api/habits/:id/log', (request, response, next) => {
    const habitId = request.params.id;
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    Habit.findById(habitId)
        .then(habit => {
            if (!habit) {
                return response.status(404).json({ error: 'habit not found' });
            }

            if (!habit.log.includes(today)) {
                habit.log.push(today);
            }

            return habit.save();
        })
        .then(updatedHabit => {
            response.json(updatedHabit);
        })
        .catch(error => next(error));
});

// Get logs for the current week
app.get('/api/habits/:id/logs', (request, response, next) => {
    const habitId = request.params.id;

    Habit.findById(habitId)
        .then(habit => {
            if (!habit) {
                return response.status(404).json({ error: 'habit not found' });
            }

            // Step 2: Filter dates to only this week
            const today = new Date();
            const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - currentDay);
            startOfWeek.setHours(0, 0, 0, 0); // Start of day

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999); // End of day

            const logsThisWeek = habit.log.filter(dateStr => {
                const date = new Date(dateStr);
                return date >= startOfWeek && date <= endOfWeek;
            });

            response.json(logsThisWeek);
        })
        .catch(error => next(error));
});

// POST to create new habits
app.post('/api/habits', (request, response, next) => {
    const { name } = request.body;

    if (!name) {
        return response.status(400).json({ error: 'name is required' });
    }

    const habit = new Habit({
        name,
    });

    habit.save()
        .then(savedHabit => response.status(201).json(savedHabit))
        .catch(error => next(error));
});

// --- Start the Server ---
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Habit Tracker API running on port ${PORT}`);
});
