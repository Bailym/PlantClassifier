const express = require('express');;
const app = express();
const axios = require("axios");
var https = require('follow-redirects').https;
var fs = require('fs');
var cors = require('cors')
const bodyParser = require('body-parser');

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '4gb' }));

app.post('/api/updatemodel', async function (req, res) {

  var classId = Object.keys(req.body)[0]

  var content = fs.readFileSync('classifier.json', 'utf8');
  var contentJSON = JSON.parse(content);
  var newValues = req.body[classId];

  console.log(newValues)

  contentJSON[classId] = newValues;
  


   fs.writeFile('classifier.json', JSON.stringify(contentJSON), function (err) {
    if (err) throw err;
    console.log('Saved!');
  }); 


  res.end()

})

app.get('/api/getmodel', async function (req, res) {


  fs.readFile('classifier.json', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/application' });
    res.write(data);
    res.end();
  });

})


app.listen(3001);
console.log("Server running on port 3001");
