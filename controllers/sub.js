const Sub = require('../models/sub')
const slugify = require('slugify')
const Product = require('../models/product')

exports.create = async (req, res) => {
    try {
        const { name, parent } = req.body
        const sub = await new Sub({ name, slug: slugify(name), parent }).save()
        res.json(sub)

    } catch (err) {
        res.status(400).send(err)
    }
}

exports.list = async (req, res) => {
    try {
        const sub = await Sub.find()
        res.status(200).json(sub)
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.read = async (req, res) => {
    try {
        let sub = await Sub.findOne({ slug: req.params.slug }).exec()
        const products = await Product.find({ subs: sub })
        res.json({
            sub,
            products
        })
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.update = async (req, res) => {
    const { name, parent } = req.body
    console.log(req.body)
    try {
        const updated = await Sub.findOneAndUpdate(
            { slug: req.params.slug },
            { name, slug: slugify(name), parent },
            { new: true }
        )
        res.json(updated)
    } catch (err) {
        res.status(400).send(err)
    }
}

exports.remove = async (req, res) => {
    try {
        let deleted = await Sub.findOneAndDelete({ slug: req.params.slug })
        res.json(deleted)
    } catch (err) {
        res.status(400).send("Delte Failed")
    }
}
