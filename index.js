const express = require('express');
const cors = require('cors'); //
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectID} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express(); // express

// Middleware
app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'process.env.ACCESS_TOKEN_SECRET', (err, decoded) => {
      if (err){
        return res.status(401).send({ message: 'Unauthorized access' });
      }
      console.log('decoded', decoded);
      req.decoded = decoded;
      next();
    });
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfti4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

// const uri = "mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfti4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const carCollection = client.db('inventory').collection('car');
        const myCarCollection = client.db('inventory').collection('myItems');

        //AUTH
        app.post('/login', async (req, res) => {
          const user = req.body;
          const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
          res.send( accessToken );
        });
       
        // get all car
       app.get('/cars', async(req, res) => {
        const query = {};
        const cursor = carCollection.find(query);
        const cars = await cursor.toArray();
        res.send(cars);
       });

        // get car by id
        app.get('/car/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const car = await carCollection.findOne(query);
            res.send(car);
        });

        // add car 
        app.post('/add-item', async(req, res) => {
            const newCar = req.body;
            const result = await carCollection.insertOne(newCar);
            res.send(result);
        });
        // delete car
        app.delete('/carDelete/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await carCollection.deleteOne(query);
            res.send(result);
        });

        // update car
        app.put('/inventory/:id', async(req, res) => {
            const id = req.params.id;
            const updateCar = req?.body;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true };
            const updateStock = {
              $set: {
                stock: updateCar.stock
              }
            };
            const result = await carCollection.updateOne(filter, updateStock, options);
            res.send(result);
        });
        // add user item to
        app.post('/add-my-items', async(req, res) => {
            const newCar = req.body;
            const result = await myItemsCollection.insertOne(newCar);
            res.send(result);
        });

        // display user item

        app.get('/my-items',verifyJWT, async(req, res) => {
          const decodedEmail = req.decoded.email;
          const email = req.query.email;
          if (email === decodedEmail) {
            const query = { email: email };
            const cursor = myCarCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
          }
          else {
            res.status(403).send({ message: 'Forbidden access' });
          }
        });
        // delete user item
        app.delete('/my-item/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await carCollection.deleteOne(query);
            res.send(result);
        });    

    }
    finally{

    }
};

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Running warehouse Server');
  // res.send(path.join(publicPath, 'index.html'));
});


app.listen(port, () => {
    console.log('Server is running on', port);
})
