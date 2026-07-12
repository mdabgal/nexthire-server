import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5000;


// Middleware

app.use(cors());

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



  try {


    await client.connect();


    console.log("✅ MongoDB Connected Successfully");



    await client.db("admin").command({
      ping:1
    });


    console.log(
      "✅ Pinged your deployment. Successfully connected to MongoDB!"
    );




    // ==========================
    // Create User
    // ==========================


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







    // ==========================
    // Get User By Email
    // ==========================


    app.get(
      "/users/:email",
      async(req:Request,res:Response)=>{


      try{


        const email = req.params.email;



        const user =
        await usersCollection.findOne({
          email
        });



        res.send(user);



      }
      catch(error){


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
      async(req:Request,res:Response)=>{


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






    // ==========================
    // Update User Role
    // ==========================


    app.patch(
      "/users/role/:email",
      async(req:Request,res:Response)=>{


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





// Root Route


app.get(
"/",
(req:Request,res:Response)=>{


res.send(
" NextHire Server is Running..."
);


});





// Server Start


app.listen(PORT,()=>{


console.log(
` Server running on http://localhost:${PORT}`
);


});