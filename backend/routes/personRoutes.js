const express = require('express');
const router = express.Router();
const Person = require('../models/Person');

// Get all people
router.get('/', async (req, res) => {
    try {
        const people = await Person.find();
        res.json(people);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a person by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Person.findByIdAndDelete(id);
        res.status(200).json({ message: 'Person deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a person by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Person.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new person
router.post('/', async (req, res) => {
    try {
        const { name, role, email, phone } = req.body;
        const newPerson = new Person({ name, role, email, phone });
        await newPerson.save();
        res.status(201).json(newPerson);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 