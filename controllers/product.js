const Product = require('../models/product')
const User = require('../models/user')
const slugify = require('slugify')

exports.create = async (req, res) => {
    try {
        req.body.slug = slugify(req.body.title)
        const newProduct = await Product(req.body).save()
        res.json(newProduct)

    } catch (err) {
        // res.status(400).send("Create Product failed")
        res.status(400).json({
            err: err.message,
        })
    }
}

exports.listAll = async (req, res) => {
    let products = await Product.find({})
        .limit(+req.params.count)
        .populate('category')
        .populate('subs')
        .exec()
    res.json(products)
}

exports.remove = async (req, res) => {
    try {
        const deleted = await Product.findOneAndRemove({ slug: req.params.slug })
        res.json(deleted)
    } catch (err) {
        console.log(err)
        res.status(400).send('Product delete failed')
    }
}

exports.read = async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug })
        .populate('category')
        .populate('subs')
        .exec()
    res.json(product)
}

exports.update = async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title)
        }
        const updated = await Product.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true })
        res.json(updated)
    } catch (err) {
        res.status(400).json({
            err: err.message,
        })
    }
}

exports.list = async (req, res) => {
    try {
        const { sort, order, page } = req.body
        const currentPage = page || 1
        const perPage = 12
        const products = await Product.find({})
            .skip((currentPage - 1) * perPage)
            .sort([[sort, order]])
            .limit(perPage)

        res.status(200).json(products)
    } catch (err) {
        console.log(err)
    }
}

exports.productsCount = async (req, res) => {
    let total = await Product.find({}).estimatedDocumentCount().exec()
    return res.json(total)
}

exports.productStars = async (req, res) => {
    const product = await Product.findById(req.params.productId)
    const user = await User.findOne({ email: req.user.email })
    const { star } = req.body

    let existingRatingObject = product.ratings.find(ele => ele.postedBy.toString() === user._id.toString())

    // nếu user chưa rating, thì push rating vào rating []
    if (!existingRatingObject) {
        let ratingAdded = await Product.findByIdAndUpdate(product._id, {
            $push: { ratings: { star: star, postedBy: user._id } }
        }, { new: true })
        res.json(ratingAdded)
    } else {
        const ratingUpdated = await Product.updateOne(
            { ratings: { $elemMatch: existingRatingObject } },
            { $set: { "ratings.$.star": star } },
            { new: true }
        )
        res.json(ratingUpdated)
    }
}

exports.listRelated = async (req, res) => {
    const product = await Product.findById(req.params.productId)

    const related = await Product.find({
        _id: { $ne: product._id },
        subs: { $all: [product.subs] }
        // category: product.category
    })
        .limit(3)
        .populate('category')
        .populate('subs')
    res.json(related)
}

const handleQuery = async (req, res, query) => {
    const products = await Product.find({ $text: { $search: query } })
        .populate('category', '_id name')
        .populate('subs', '_id name')
    res.json(products)
}

const handlePrice = async (req, res, price) => {
    try {
        let products = await Product.find({
            price: {
                $gte: price[0],
                $lte: price[1]
            }
        })
            .populate('category', '_id name')
            .populate('subs', '_id name')
        res.json(products)
    } catch (err) {
        console.log(err)
    }
}

const handleCategory = async (req, res, category) => {
    let products = await Product.find({ category })
        .populate('category', '_id name')
        .populate('subs', '_id name')
    res.json(products)
}

const handleStar = async (req, res, stars) => {
    Product.aggregate([
        {
            $project: {
                document: "$$ROOT",
                floorAverage: {
                    $floor: { $avg: "$ratings.star" }
                }
            }
        },
        { $match: { floorAverage: stars } }
    ])
        .exec((err, aggregates) => {
            if (err) console.log("AGGREGATE ERROR", err);
            Product.find({ _id: aggregates })
                .populate("category", "_id name")
                .populate("subs", "_id name")
                .populate("postedBy", "_id name")
                .exec((err, products) => {
                    if (err) console.log("PRODUCT AGGREGATE ERROR", err);
                    res.json(products);
                });
        });

}

const handleSub = async (req, res, sub) => {
    let products = await Product.find({ subs: sub })
        .populate('category', '_id name')
        .populate('subs', '_id name')
    res.json(products)
}
const handleShipping = async (req, res, shipping) => {
    const products = await Product.find({ shipping })
        .populate("category", "_id name")
        .populate("subs", "_id name")
        .populate("postedBy", "_id name")
        .exec();

    res.json(products);
};

const handleColor = async (req, res, color) => {
    const products = await Product.find({ color })
        .populate("category", "_id name")
        .populate("subs", "_id name")
        .populate("postedBy", "_id name")
        .exec();

    res.json(products);
};

const handleBrand = async (req, res, brand) => {
    const products = await Product.find({ brand })
        .populate("category", "_id name")
        .populate("subs", "_id name")
        .populate("postedBy", "_id name")
        .exec();

    res.json(products);
};

exports.searchFilters = async (req, res) => {
    const {
        query,
        price,
        category,
        stars,
        sub,
        shipping,
        color,
        brand,
    } = req.body;

    if (query) {
        console.log("query --->", query);
        await handleQuery(req, res, query);
    }

    // price [20, 200]
    if (price !== undefined) {
        console.log("price ---> ", price);
        await handlePrice(req, res, price);
    }

    if (category) {
        console.log("category ---> ", category);
        await handleCategory(req, res, category);
    }

    if (stars) {
        console.log("stars ---> ", stars);
        await handleStar(req, res, stars);
    }

    if (sub) {
        console.log("sub ---> ", sub);
        await handleSub(req, res, sub);
    }

    if (shipping) {
        console.log("shipping ---> ", shipping);
        await handleShipping(req, res, shipping);
    }

    if (color) {
        console.log("color ---> ", color);
        await handleColor(req, res, color);
    }

    if (brand) {
        console.log("brand ---> ", brand);
        await handleBrand(req, res, brand);
    }
};