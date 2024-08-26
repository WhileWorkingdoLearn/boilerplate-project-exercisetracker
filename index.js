const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: String,
});

const UserSchema = new mongoose.Schema({
  username: String,
});


const userCache = {};

let Exercise = mongoose.model('Exercise', ExerciseSchema);

let User= mongoose.model('User', UserSchema);



mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).catch((err)=> console.log("err: " + err));

function generateID(length){
    const a = "cbf12345678";
    let id = "";
    for (let index = 0; index < length; index++) {
      const element = array[Math.random()* (a.length -1)];
      id += element;
    }
    return id;
}




app.use(cors());
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get('/api/users',(req, res) => {
    User.find({}).then(
      (users)=> {
        const responseUser = users.map((user => {return {username: user.username, _id:user._id}}))
        res.json(responseUser);
      }
    ).catch((err) =>{
      console.log("errFind: " + err);
       res.json([])});
});

app.use(bodyParser.urlencoded({ extended: false }))

app.post('/api/users',async(reg,res)=> {
  console.log('post users');
  const userName = reg.body.username;
  console.log('post: '+ userName);
  if(userName){
      const user = new User({username:userName});
      user.save().then(
        (u) => { console.log("Saved: "+ u);
          res.json(u);
        }
      ).catch(err => {
        console.log("errPost: " + err);
        res.json({"err":"User could not be saved"})
      });
  } else {
    res.json({"err":"User not defined"});
  }

});

app.post('/api/users/:id/exercises',async(req,res)=> {
    console.log('post exercises');
    const userID = req.params.id;
    const description = req.body.description;
    const duration = req.body.duration;
    const date = req.body.date;
    console.log(userID);
    if(description && duration && userID){
        User.findById(userID).then((user) => {
          new Exercise({
            username: user.username,
            description: description,
            duration: duration,
            date: date || new Date().toDateString(),
        }).save().then((result) => {
          res.json({
            username: user.username,
            _id:user._id,
            description: result.description,
            duration: result.duration,
            date: result.date,
          });
        }).catch((err)=> {
          console.log("post exercise save err: " + err);
          res.json({"err": "couldn save exersize"})
        })

        }).catch((err) =>
           res.json({"err":"User not found"}));
       
    } else {
      res.json({"err":"Description or duration missing"});
    }

});

app.get('/api/users/:id/logs',async (req,res)=> {
  const userId = req.params.id;
  console.log("GetLog: " + userId);
  if(userId){
    User.findById(userId)
    .then((user)=>{
      console.log("user: " + user);
      Exercise.find({username:user.username}).then(
        (tasks)=>{
          const log = {
            username: user.username,
            count: tasks.length,
            _id: user._id,
            log: tasks.map((task) => {return {
              description: task.description,
              duration: task.duration,
              date: task.date,
            }})
          }
          console.log("tasks: " + log);
          res.json(log);
        }
      ).catch((err)=>{
        console.log("err:"+ err);
        return [];
      });
    })
    .catch((err)=> {
      console.log("errGetLog" + err);
      res.json({"err":"user not found"});
    })
  }else{
    res.json({"err":"id is missing"});
  }
});


app.get('/api/users/deleteUser',async (req,res)=> {
  User.remove({})
  .then((result) => { console.log("all deleted")
    res.send("all users deleted");
  })
  .catch((err) => {
    console.log(err);
    res.send("couldn't delete all users")
  });

});

app.get('/api/users/deleteTasks',async (req,res)=> {
  Exercise.remove({})
  .then((result) => {
    console.log("all deleted");
    res.send("all tasks deleted");
  })
  .catch((err) => { 
    console.log(err);
    res.send("coldn't delete all tasks");
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
  //User.remove({}).then(result => console.log("all deleted")).catch(err => console.log(err));

})
