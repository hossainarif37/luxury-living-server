const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000

//* Stripe Secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ausoith.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db('luxury-living');

        //?********** Collections **********//
        //User
        const userCollection = database.collection('users');
        // Service
        const serviceCollection = database.collection('services');
        // Cart
        const cartCollection = database.collection('cart');
        // Order
        const orderCollection = database.collection('orders');

        //* Verify the admin role
        const verifyAdmin = async (req, res, next) => {
            const email = req.body.email;
            const requestedUser = await userCollection.findOne({ email });
            const isAdmin = requestedUser.role === 'admin';
            if (!isAdmin) {
                return res.send({ message: 'You have  no permission to make an admin' })
            }
            next();
        }


        //?-----------🤵 User Api Start 🤵-----------*//
        //* POST a user
        app.post('/users', async (req, res) => {
            const doc = req.body;
            const query = { email: doc.email };
            const isUserExist = await userCollection.findOne(query);
            if (isUserExist) {
                return res.send({ message: 'User already exist!' })
            }
            const result = await userCollection.insertOne(doc);
            res.send(result);
        })

        //* GET all users
        app.get('/users', async (req, res) => {
            const users = await userCollection.find({}).toArray();
            res.send(users);
        })
        //* GET a user
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.findOne({ email });
            return res.send(user)
        })

        //* UPDATE the user role
        app.patch('/users', async (req, res) => {
            const filter = req.query;
            const role = req.body.role;
            const updateDoc = {
                $set: {
                    role: role
                }
            }

            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        })
        //?-----------🤵 User Api End 🤵-----------*//

        //?-----------🎀 Service Api Start 🎀-----------*//
        //* POST a service
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })

        //* GET all services
        app.get('/services', async (req, res) => {
            const services = await serviceCollection.find({}).toArray();
            res.send(services);
        })

        //*GET a specific service by dynamic route
        app.get('/services/:id', async (req, res) => {
            const filter = req.params.id;
            const result = await serviceCollection.findOne({ _id: new ObjectId(filter) });
            res.send(result);
        })

        //* UPDATE a specific service
        app.patch('/services', async (req, res) => {
            const { id } = req.query;
            const filter = { _id: new ObjectId(id) };
            const data = req.body;
            const updateDoc = {
                $set: data
            }
            const result = await serviceCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //* DELETE a specific service
        app.delete('/services', async (req, res) => {
            const { id } = req.query;
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })
        //?-----------🎀 Service Api End 🎀-----------*//

        //?-----------🛒 Cart Api Start 🛒-----------*//
        //* POST a specific service to Cart
        app.post('/cart', async (req, res) => {
            const cartData = req.body;
            const isCartExist = await cartCollection.findOne({ title: cartData.title, email: cartData.email })
            if (isCartExist) {
                return res.send({ message: 'Service already exist in your dashboard, please add to another service!' })
            }
            const result = await cartCollection.insertOne(cartData);
            res.send(result);
        })

        //* GET specific user cart
        app.get('/cart', async (req, res) => {
            const filter = req.query;
            const cart = await cartCollection.find(filter).toArray();
            res.send(cart);
        })

        //* GET a cart
        app.get('/cart/:id', async (req, res) => {
            const { id } = req.params;
            const cart = await cartCollection.findOne({ _id: new ObjectId(id) });
            res.send(cart);
        })

        //* DELETE a cart
        app.delete('/cart', async (req, res) => {
            const { id } = req.query;
            const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        })
        //?-----------🛒 Cart Api End 🛒-----------*//

        //?----------- Order Api Start -----------*//
        //* Create Payment Intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;


            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card'],
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        //* POST a order
        app.post('/orders', async (req, res) => {
            const orderData = req.body;
            const result = await orderCollection.insertOne(orderData);
            res.send(result);
        })

        //* GET specific user orders
        app.get('/orders', async (req, res) => {
            const filter = req.query;
            const orders = await orderCollection.find(filter).toArray();
            res.send(orders);

        })

        //* UPDATE Delivery Status of User Order
        app.patch('/orders', async (req, res) => {
            const id = req.query.id;
            const deliveryStatus = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: deliveryStatus
            }
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        //* GET all orders
        app.get('/orders', async (req, res) => {
            const orders = await orderCollection.find({}).toArray();
            res.send(orders);
        })

        //?----------- Order Api End -----------*//


        console.log("Database Connected");
    }

    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Luxury Living Server Side')
})

app.listen(port, () => {
    console.log(`Luxury Living listening on port ${port}`)
})