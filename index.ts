import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();
const jwt = require("jsonwebtoken");
const app: Application = express();

const PORT = process.env.PORT || 5000;


// Middleware

// app.use(cors());
const allowedOrigins = ['https://nexthire-client.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));





app.use(express.json());



// MongoDB URI

const uri = process.env.MONGODB_URI as string;



const client = new MongoClient(uri, {

  serverApi: {

    version: ServerApiVersion.v1,

    strict: true,

    deprecationErrors: true,

  },

});

async function run() {


  const db = client.db("nexthire");


  // Collections

  const usersCollection = db.collection("users");

  const jobsCollection = db.collection("jobs");

const applicationsCollection = db.collection("applications");
const contactCollection = db.collection("contacts");
  try {


    await client.connect();


    console.log("✅ MongoDB Connected Successfully");



    // await client.db("admin").command({
    //   ping:1
    // });


    console.log(
      "✅ Pinged your deployment. Successfully connected to MongoDB!"
    );
const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
console.log("Authorization:", authorization);
  if (!authorization) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: any, decoded: any) => {

          console.log("JWT Error:", err);
    console.log("Decoded:", decoded);

      if (err) {
        return res.status(401).send({
          message: "Unauthorized Access",
        });
      }

      (req as any).user = decoded;

      next();
    }
  );
};



app.post("/jwt", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    res.send({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "JWT Generate Failed",
    });
  }
});

    app.post(
      "/users",
      async(req:Request,res:Response)=>{

      try{
        const user = req.body;

        const existingUser =
        await usersCollection.findOne({
          email:user.email
        });
   if(existingUser){

          return res.send({

            success:false,

            message:"User already exists"

          });

        }
        const result =
        await usersCollection.insertOne(user);



        res.send({

          success:true,

          message:"User Created Successfully",

          insertedId:result.insertedId

        });
      }
      catch(error){


        console.log(error);


        res.status(500).send({

          success:false,

          message:"Internal Server Error"

        });
      }
    });

 
    app.get(
       
      "/users",
      async(req:Request,res:Response)=>{
      try{
        const users =
        await usersCollection.find()
        .toArray();
        res.send(users);
      }
      catch(error){
        res.status(500).send({
          success:false
        });
      }
    });

   app.post(
  "/jobs",
  verifyToken,
  async (req: Request, res: Response) => {


      try{
   const job = {
         ...req.body,
          createdAt:new Date()

        };

       const result =
        await jobsCollection.insertOne(job);

        res.send({
          success:true,
          message:"Job Added Successfully",
          insertedId:result.insertedId

        });



      }
      catch(error){
        console.log(error);
        res.status(500).send({
          success:false,
          message:"Internal Server Error"
        });

      }
    });
    app.get(
      "/jobs",
      async(req:Request,res:Response)=>{


      try{


        const jobs =
        await jobsCollection.find()
        .sort({
          createdAt:-1
        })
        .toArray();



        res.send(jobs);



      }
      catch(error){


        console.log(error);



        res.status(500).send({

          success:false,

          message:"Internal Server Error"

        });


      }



    });




app.get(
  "/jobs/:id",
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const job = await jobsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(job);
    } catch (error) {
      console.log(error);

      res.status(500).send({
        success: false,
        message: "Job Not Found",
      });
    }
  }
);



app.delete(
  "/jobs/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;

      if (!id || Array.isArray(id)) {
        return res.status(400).send({
          success: false,
          message: "Invalid Job ID",
        });
      }

      const result = await jobsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send({
        success: true,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.log(error);

      res.status(500).send({
        success: false,
        message: "Delete Failed",
      });
    }
  }
);

app.get(
  "/jobs/employer/:email",
  async (req: Request, res: Response) => {
    try {
      const email = req.params.email;

      const jobs = await jobsCollection
        .find({
          employerEmail: email,
        })
        .toArray();

      res.send(jobs);
    } catch (error) {
      console.log(error);

      res.status(500).send({
        success: false,
      });
    }
  }
);



app.get("/users/:email", async (req: Request, res: Response) => {
  try {
    const email = req.params.email;

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.send(user);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server Error",
    });
  }
});

app.post(
  "/applications",
  verifyToken,
  async (req, res) => {
  console.log("Application Body:", req.body);

  try {
    const application = {
      ...req.body,
      appliedAt: new Date(),
    };

    const result = await applicationsCollection.insertOne(application);

    console.log(result);

    res.send({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
    });
  }
});






app.put(
  "/jobs/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      if (!id) {
        return res.status(400).send({
          success: false,
          message: "Invalid Job ID",
        });
      }

      const updatedJob = req.body;

      const result = await jobsCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updatedJob,
        }
      );

      res.send({
        success: true,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.log(error);

      res.status(500).send({
        success: false,
        message: "Update Failed",
      });
    }
  }
);
app.get(
  "/applications/:email",
  async (req: Request, res: Response) => {
    try {
      const email = req.params.email;

      const result = await applicationsCollection
        .find({
          $or: [
            { email: email },
            { applicantEmail: email },
          ],
        })
        .toArray();

      res.send(result);
    } catch (error) {
      console.log(error);

      res.status(500).send({
        success: false,
      });
    }
  }
);

app.get(
  "/applications",
  async (req: Request, res: Response) => {
    try {
      const result =
        await applicationsCollection.find().toArray();

      res.send(result);
    } catch {
      res.status(500).send({
        success: false,
      });
    }
  }
);




app.post("/contacts", async (req, res) => {

  try {

    const contactData = {
      ...req.body,
      createdAt: new Date(),
    };


    const result = await contactCollection.insertOne(contactData);


    res.send({
      success: true,
      message: "Message sent successfully",
      insertedId: result.insertedId,
    });


  } catch (error) {

    console.log(error);

    res.status(500).send({
      success: false,
      message: "Failed to send message",
    });

  }

});



app.get("/contacts", async (req, res) => {

  try {

    const result = await contactCollection
      .find()
      .sort({
        createdAt: -1
      })
      .toArray();


    res.send(result);


  } catch(error){

    res.status(500).send({
      message:"Failed to fetch contacts"
    });

  }

});


 app.patch(
  "/users/role/:email",
  verifyToken,
  async (req: Request, res: Response) => {

      try{


        const email =
        req.params.email;



        const {role}=req.body;



        const result =
        await usersCollection.updateOne(
        {
            email
          },
          {
            $set:{
              role
            }
          }
        );
        res.send(result);
  }
      catch(error){
        res.status(500).send({
          success:false
        });
      }
    });
  }
  finally{

    // keep connection alive
  }
}
run()
.catch(console.dir);
app.get(
"/",
(req:Request,res:Response)=>{
res.send(
" NextHire Server is Running..."
);
});
app.listen(PORT,()=>{
console.log(
` Server running on http://localhost:${PORT}`
);

});