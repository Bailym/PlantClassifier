const express = require('express');;
const app = express();
const axios = require("axios");
var https = require('follow-redirects').https;
var fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '4gb' }));

app.post('/api/updatemodel', async function (req, res) {

  var classId = Object.keys(req.body)[0]  //the class being updated 

  var content = fs.readFileSync('classifier.json', 'utf8'); //read the classifier
  var contentJSON = JSON.parse(content);  //parse the classifier
  var newValues = req.body[classId];  //We only want to read the data of the class being updated

  contentJSON[classId] = newValues; //update the JSON with the new values
  
  //overwrite the existing classifier json
   fs.writeFile('classifier.json', JSON.stringify(contentJSON), function (err) {
    if (err) throw err;
    console.log('Saved!');
  }); 

  res.end()

})

app.get('/api/getmodel', async function (req, res) {


  //read the classifier file and send to the client
  fs.readFile('classifier.json', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/application' });
    res.write(data);
    res.end();
  });

})

var port = process.env.PORT || 3001
app.listen(port);
console.log("Server running on port " + port);
