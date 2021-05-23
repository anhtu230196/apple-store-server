const Category = require('../models/category')
const Sub = require('../models/sub')
const Product = require('../models/product')

const slugify = require('slugify')

exports.create = async (req, res) => {
    try {
        const { name } = req.body
        const category = await new Category({ name, slug: slugify(name) }).save()
        res.json(category)
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.list = async (req, res) => {
    try {
        const category = await Category.find()
        res.status(200).json(category)
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.read = async (req, res) => {
    try {
        let category = await Category.findOne({ slug: req.params.slug })
        const products = await Product.find({ category: category }).populate('category')
        res.json({
            category,
            products
        })
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.update = async (req, res) => {
    const { name } = req.body
    try {
        const updated = await Category.findOneAndUpdate(
            { slug: req.params.slug },
            { name, slug: slugify(name) },
            { new: true }
        )
        res.json(updated)
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.remove = async (req, res) => {
    try {
        let deleted = await Category.findOneAndDelete({ slug: req.params.slug })
        res.json(deleted)
    } catch (err) {
        res.status(400).send("Delte Failed")
    }
}

exports.getSubs = (req, res) => {
    Sub.find({ parent: req.params._id }).exec((err, subs) => {
        if (err) console.log(err)
        res.json(subs)
    })
}