const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, "Name is required"],
        text: true
    },
    slug: {
        type: String,
        lowercase: true,
        index: true
    },
    description: {
        type: String,
        text: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    category: {
        type: ObjectId,
        ref: "Category",
    },
    subs: [
        {
            type: ObjectId,
            ref: "Sub",
        }
    ],
    quantity: Number,
    sold: {
        type: Number,
        default: 0
    },
    images: {
        type: Array
    },
    shipping: {
        type: String,
        enum: ["Yes", "No"]
    },
    color: {
        type: String,
        enum: ["Black", "Brown", "Silver", "White", "Blue"]
    },

    ratings: [
        {
            star: Number,
            postedBy: { type: ObjectId, ref: 'User' }
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)