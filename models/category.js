const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required"],
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true
    }
})

module.exports = mongoose.model('Category', categorySchema)