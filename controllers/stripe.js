const User = require("../models/user")
const Product = require("../models/product")
const Cart = require("../models/cart")
const Coupon = require("../models/coupon")
const stripe = require('stripe')(process.env.STRIPE_SECRET)

exports.createPaymentIntent = async (req, res) => {
    const { couponApplied } = req.body // couponApplied from redux: boolean
    // 1 find user
    const user = await User.findOne({ email: req.user.email })
    // 2 get user cart total
    const { cartTotal, totalAfterDiscount } = await Cart.findOne({ orderdBy: user._id })

    let finalAmount = 0; // số tiền sẽ lưu lên stripe && trả cho client
    if (couponApplied && totalAfterDiscount) {
        finalAmount = (totalAfterDiscount * 100)
    } else {
        finalAmount = (cartTotal * 100)
    }
    // amount gửi lên stripe sẽ có đơn vị là cent
    // client gửi lên đơn vị là $ nên sẽ nhân thêm 100
    const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: "usd"
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
        cartTotal,
        totalAfterDiscount,
        payable: finalAmount
    });
}