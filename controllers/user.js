const User = require("../models/user")
const Product = require("../models/product")
const Cart = require("../models/cart")
const Coupon = require("../models/coupon")
const Order = require("../models/order")
const uniqueId = require("uniqueid")

exports.userCart = async (req, res) => {
    const { cart } = req.body
    let products = []
    const user = await User.findOne({ email: req.user.email })
    const checkCartExistByUser = await Cart.findOne({ orderdBy: user._id }).exec()
    // Nếu user này đang có cart trong data thì remove
    if (checkCartExistByUser) {
        checkCartExistByUser.remove()
    }

    for (let i = 0; i < cart.length; i++) {
        let object = {}
        object.product = cart[i]._id;
        object.count = cart[i].count;
        object.color = cart[i].color
        let productFromDb = await Product.findById(cart[i]._id).select('price')
        object.price = productFromDb.price

        products.push(object)
    }
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
        cartTotal += products[i].price * products[i].count
    }

    let newCart = await Cart({
        products,
        cartTotal,
        orderdBy: user._id
    }).save()

    res.json({ ok: true })
}

exports.getUserCart = async (req, res) => {
    const user = await User.findOne({ email: req.user.email })
    let cart = await Cart.findOne({ orderdBy: user._id })
        .populate("products.product", "_id title price totalAfterDiscount")
        .exec();

    const { products, cartTotal, totalAfterDiscount } = cart
    res.json({
        products,
        cartTotal,
        totalAfterDiscount
    })
}

exports.emptyCart = async (req, res) => {
    const user = await User.findOne({ email: req.user.email })
    const cart = await Cart.findOneAndRemove({ orderdBy: user._id })
    res.json(cart)
}

exports.saveAddress = async (req, res) => {
    const userAddress = await User.findOneAndUpdate(
        { email: req.user.email },
        { address: req.body.address },
        { new: true }
    )
    res.json({ ok: true })
}

exports.applyCouponToUserCart = async (req, res) => {
    const { coupon } = req.body
    const validCoupon = await Coupon.findOne({ name: coupon })

    if (!validCoupon) return res.json({ err: "Invalid Coupon" })

    const user = await User.findOne({ email: req.user.email })

    let { products, cartTotal } = await Cart.findOne({ orderdBy: user._id })
        .populate("products.product", "_id price title")

    let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2)

    //exec để đợi kết quả
    Cart.findOneAndUpdate({ orderdBy: user._id }, { totalAfterDiscount }, { new: true }).exec()

    res.json(totalAfterDiscount)
}

exports.createOrder = async (req, res) => {
    const { paymentIntent } = req.body.stripeResponse
    const user = await User.findOne({ email: req.user.email }).exec()

    let { products } = await Cart.findOne({ orderdBy: user._id }).exec()

    let newOrder = await new Order({
        products,
        paymentIntent,
        orderdBy: user._id
    }).save()

    // decrement quantity, increment sold
    let bulkOption = products.map((item) => {
        return {
            updateOne: {
                filter: { _id: item.product._id }, // IMPORTANT item.product
                update: { $inc: { quantity: -item.count, sold: +item.count } },
            },
        };
    });

    let updated = await Product.bulkWrite(bulkOption, { new: true })

    res.json({ ok: true })
}

exports.createCashOrder = async (req, res) => {
    const { COD, couponApplied } = req.body

    const user = await User.findOne({ email: req.user.email }).exec()

    let userCart = await Cart.findOne({ orderdBy: user._id }).exec()

    let finalAmount = 0; // số tiền sẽ lưu lên stripe && trả cho client
    if (couponApplied && userCart.totalAfterDiscount) {
        finalAmount = (userCart.totalAfterDiscount * 100)
    } else {
        finalAmount = (userCart.cartTotal * 100)
    }

    let paymentIntent = {
        id: uniqueId(),
        amount: finalAmount,
        currency: 'usd',
        status: "COD",
        created: Date.now(),
        payment_method_types: ['cash']
    }
    console.log(paymentIntent)

    let newOrder = await new Order({
        products: userCart.products,
        paymentIntent,
        orderdBy: user._id,
        status: "COD"
    }).save()

    // decrement quantity, increment sold
    let bulkOption = userCart.products.map((item) => {
        return {
            updateOne: {
                filter: { _id: item.product._id }, // IMPORTANT item.product
                update: { $inc: { quantity: -item.count, sold: +item.count } },
            },
        };
    });

    let updated = await Product.bulkWrite(bulkOption, { new: true })

    res.json({ ok: true, newOrder })
}

exports.orders = async (req, res) => {
    let user = await User.findOne({ email: req.user.email }).exec()

    let userOrders = await Order.find({ orderdBy: user._id })
        .populate("products.product").exec()

    res.json(userOrders)
}

exports.addToWishlist = async (req, res) => {
    const { productId } = req.body
    const user = await User.findOneAndUpdate(
        { email: req.user.email },
        { $addToSet: { wishlist: productId } },
        { new: true }
    ).exec()

    res.json({ ok: true })
}

exports.wishlist = async (req, res) => {
    const list = await User.findOne({ email: req.user.email })
        .select("wishlist")
        .populate("wishlist")
        .exec()
    res.json(list)
}

exports.removeFromWishlist = async (req, res) => {
    const { productId } = req.params;
    const user = await User.findOneAndUpdate(
        { email: req.user.email },
        { $pull: { wishlist: productId } }
    ).exec()
    res.json({ ok: true })
}