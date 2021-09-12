const express =require('express')
const app=express()
const cors = require("cors");
const PORT =process.env.PORT || 3000

const mongodb = require("mongodb");
const bcryptjs = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv");
dotenv.config();
const url = process.env.DB;

app.use(
    cors({
      origin: "*",
    })
  );

 
function authenticate(req, res, next) {
  try {
    console.log(req.headers.authorization);
    //check if token is present
    //if present -> check it is valid
    if (req.headers.authorization) {
      jwt.verify(
        req.headers.authorization,
        "EgK(/8}TC8veVBK?",
        function (error, decoded) {
          if (error) {
            res.status(500).json({
              message: "Unauthorzed",
            });
          } else {
            console.log(decoded);
            req.userid = decoded.id;
            next();
          }
        }
      );
    } else {
      res.status(401).json({
        message: "No token present",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

app.use(express.json());

app.post("/register", async function (req, res) {
  try {
    //connect the DB
    let client = await mongoClient.connect(url);

    //select DB
    let db = client.db("pizza-app");
    //Hash the password
    let salt = bcryptjs.genSaltSync(10);
    let hash = bcryptjs.hashSync(req.body.password, salt);
    req.body.password = hash;

    //select the collection and perform action
    delete req.body.confirmpassword;
    let data = await db.collection("users").insertOne(req.body);

    //closing the connection
    await client.close();

    res.json({
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
      id: data._id,
    });
  }
});

app.post("/login", async function (req, res) {
  try {
    //connect the DB
    let client = await mongoClient.connect(url);

    //select DB
    let db = client.db("pizza-app");

    //find the user with email

    let user = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (user) {
      // hash the incoming password
      // compare password with users password
      let matchPassword = bcryptjs.compareSync(
        req.body.password,
        user.password
      );
      if (matchPassword) {
        //generate JWT token
        let token = jwt.sign({ id: user._id }, process.env.JWT_SECERT);
        console.log(token);
        res.json({
          message: true,
          token,
        });
      } else {
        res.status(404).json({
          message: "Username/Password incorrect",
        });
      }
      //if both are correct then allow
    } else {
      res.status(404).json({
        message: "Username/Password incorrect",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/menus", async function (req, res) {
  try {
    //connect the DB
    let client = await mongoClient.connect(url);

    //select DB
    let db = client.db("pizza-app");

    //select the collection and perform action
    let data = await db
      .collection("menus")
      .find({})
      .toArray();

    //closing the connection
    await client.close();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
    });
  }
});

app.get("/menus/:id", async function (req, res) {
  try {
    //connect the DB
    let client = await mongoClient.connect(url);

    //select DB
    let db = client.db("pizza-app");

    //select the collection and perform action
    let data = await db
      .collection("menus")
      .findOne({_id: mongodb.ObjectId(req.params.id)})
      

    //closing the connection
    await client.close();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
    });
  }
});

app.post("/addItemToCart", async function (req, res) {
  try {
    //connect the DB
    let client = await mongoClient.connect(url);

    //select DB
    let db = client.db("pizza-app");

    let data = await db.collection("cart").insertOne(req.body);

    //closing the connection
    await client.close();

    res.json({
      message: "Item added to cart successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
      id: data._id,
    });
  }
});


app.listen(PORT,function(){
    console.log(`App listening on PORT ${PORT}`);
})