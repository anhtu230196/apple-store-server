const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const subSchema = new mongoose.Schema({
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
    },
    parent: {
        type: ObjectId,
        ref: "Category",
        required: true
    }
})

module.exports = mongoose.model('Sub', subSchema)