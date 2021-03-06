const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator/check");

const User = require("../../models/User");

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  "/",
  [
    check("name", "Name is required")
      .not()
      .isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        User.findOne({email:email})
            .then(
                async (user)=>{
                    if (user){
                        return res.status(400).json({ errors: [{ msg: "User already exists" }] });
                    } else{
                        user = new User({name, email, password});

                        //Encrypting Password
                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(password, salt);

                        //Saving users
                        await user.save();

                        //Returning JSON Web Token
                        const payload = {user: {id: user.id}};
                        const options = {expiresIn: 3600};
                        jwt.sign(payload, process.env.jwtSecret, options, (err, token) => {
                                if (err) throw err;
                                return res.json({ token });
                            }
                        );
                    }
                }
            );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
