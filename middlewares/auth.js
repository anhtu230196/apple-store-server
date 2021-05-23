const admin = require('../firebase')
const User = require("../models/user")

exports.authCheck = async (req, res, next) => {
    try {
        const firebaseUser = await admin
            .auth()
            .verifyIdToken(req.headers.authtoken)
        req.user = firebaseUser
        next()
    } catch (err) {
        res.status(401).json({
            err: "Invalid or expired token"
        })
    }
}

exports.adminCheck = async (req, res, next) => {
    const { email } = req.user

    const adminUser = await User.findOne({ email })

    if (adminUser.role !== 'admin') {
        return res.status(403).json({
            err: 'Admin resource. Access denied'
        })
    }
    next()
}