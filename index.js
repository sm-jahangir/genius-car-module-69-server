const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
  console.log("inside verifyJWT", authHeader);
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.92306.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db("geniusCar").collection("order");

    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // Get all services
    app.get("/services", async (request, response) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      response.send(services);
    });
    app.get("/service/:id", async (request, response) => {
      const id = request.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      response.send(service);
    });
    app.post("/service", async (request, response) => {
      // create a document to insert
      const newService = request.body;
      const result = await serviceCollection.insertOne(newService);
      response.send(result);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
    });
    app.delete("/service/:id", async (request, response) => {
      const id = request.params.id;
      // Query for a movie that has title "Annie Hall"
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      response.send(result);
    });
    // Get All Orders
    app.get("/orders", verifyJWT, async (request, response) => {
      const decodedEmail = request.decoded.email;

      const email = request.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        response.send(orders);
      } else {
        response.status(403).send({ message: "Forbidden access" });
      }
    });
    // Order Collection API
    app.post("/order", async (request, response) => {
      const order = request.body;
      const result = await orderCollection.insertOne(order);
      response.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello World! Running my Node CRUD Server");
});
app.get("/hero", (req, res) => {
  res.send("Hello World! Heroku Running Server");
});

app.listen(port, () => {
  console.log(`Express app listening on port ${port}`);
});
