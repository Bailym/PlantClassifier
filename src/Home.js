import React from 'react';
import * as tf from '@tensorflow/tfjs';
const knnClassifier = require('@tensorflow-models/knn-classifier');
const mobilenet = require('@tensorflow-models/mobilenet');
const axios = require('axios');
let webcamElement
let webcam;
let net;
var classifier = knnClassifier.create();
var fs = require('fs');
var classifierJSON = require("./classifier.json")

class Home extends React.Component {

  componentDidMount = async () => {

    webcamElement = document.getElementById('webcam');

    // Load the mobilenet model
    net = await mobilenet.load();
    this.load();

    // Create an object from Tensorflow.js data API which could capture image 
    // from the web camera as Tensor.
    //Create a live webcam feed
    webcam = await tf.data.webcam(webcamElement);

    //Continuously read the webcam feed.
    while (true) {
      if (classifier.getNumClasses() > 0) {
        //image from the webcam
        const img = await webcam.capture();

        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(img, 'conv_preds');
        // Get the most likely class and confidence from the classifier module.
        const result = await classifier.predictClass(activation);

        const classes = ['Coffee Arabica', 'Parlour Palm', 'Aloe Vera'];

        //update the front end with the prediction
        document.getElementById('console').innerText = `
        prediction: ${classes[result.label]}\n
        probability: ${result.confidences[result.label]}
      `;

        // Dispose the tensor to release the memory.
        img.dispose();
      }
      await tf.nextFrame();
    }


  }

  addExample = async (classId) => {
    // Capture an image from the web camera.
    const img = await webcam.capture();

    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    const activation = net.infer(img, 'conv_preds');

    // Pass the intermediate activation to the classifier.
    //Associate this activation function with the selected class
    classifier.addExample(activation, classId);

    // Dispose the tensor to release the memory.
    this.save()
    img.dispose();
  };

  save = async () => {
    let dataset = classifier.getClassifierDataset()
    var datasetObj = {}
    Object.keys(dataset).forEach((key) => {
      let data = dataset[key].dataSync();
      // use Array.from() so when JSON.stringify() it covert to an array string e.g [0.1,-0.2...] 
      // instead of object e.g {0:"0.1", 1:"-0.2"...}
      datasetObj[key] = Array.from(data);
    });
    let jsonStr = JSON.stringify(datasetObj)

    console.log(jsonStr)
    //can be change to other source

    await axios.post('http://localhost:3001/api/updatemodel', datasetObj)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });


  };

  load = async () => {
    //can be change to other source
    await axios.get('http://localhost:3001/api/getmodel')
      .then(function (response) {
        console.log(response.data);

        try {
          let tensorObj = response.data
          //covert back to tensor
          Object.keys(tensorObj).forEach((key) => {
            tensorObj[key] = tf.tensor(tensorObj[key], [tensorObj[key].length / 1024, 1024])
          })
          classifier.setClassifierDataset(tensorObj);
        }
        catch (error) {
          console.log(error)

        }
      })
      .catch(function (error) {
        console.log(error);
      });



  }

  render = () => {

    return (
      <div>
        <video autoPlay playsInline muted id="webcam" width="224" height="224"></video>
        <button id="class-a" onClick={() => this.addExample(0)}>Add Coffee Arabica</button>
        <button id="class-b" onClick={() => this.addExample(1)}>Add Parlour Palm</button>
        <button id="class-c" onClick={() => this.addExample(2)}>Add Aloe Vera</button>
        {/* <button id="class-d">Add Pikachu</button>
        <button id="class-e">Add Sonic</button> */}

        <div id="console">


        </div>
      </div>
    )
  }

}

export default Home;
