import React from 'react';
import * as tf from '@tensorflow/tfjs';
const knnClassifier = require('@tensorflow-models/knn-classifier');
const mobilenet = require('@tensorflow-models/mobilenet');
const axios = require('axios');

class Webcam extends React.Component {


  constructor(props) {
    super(props);
    this.state = {
      webcam: null,
      net: null,
      classifier: null,
    }
  }



  componentDidMount = async () => {

    // Load the mobilenet model
    var netInit = await mobilenet.load();
    var classifierInit = knnClassifier.create();


    // Create an object from Tensorflow.js data API which could capture image 
    // from the web camera as Tensor.
    //Create a live webcam feed
    var webcamInit = await tf.data.webcam(document.getElementById('webcam'));

    this.setState({
      webcam: webcamInit,
      net: netInit,
      classifier: classifierInit,

    })

    this.load();


    //Continuously read the webcam feed.
    while (true) {
      if (this.state.classifier.getNumClasses() > 0) {
        //image from the webcam
        const img = await this.state.webcam.capture();

        console.log(img)

        // Get the activation from mobilenet from the webcam.
        const activation = this.state.net.infer(img, 'conv_preds');
        // Get the most likely class and confidence from the classifier module.
        const result = await this.state.classifier.predictClass(activation);

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

    var tempClassifier = this.state.classifier;
    // Capture an image from the web camera.
    const img = await this.state.webcam.capture();

    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    const activation = this.state.net.infer(img, 'conv_preds');

    // Pass the intermediate activation to the classifier.
    //Associate this activation function with the selected class
    tempClassifier.addExample(activation, classId);

    // Dispose the tensor to release the memory.

    this.setState({
      classifier: tempClassifier,
    })
    console.log(this.state);

    this.save(classId)
    img.dispose();
  };

  save = async (classId) => {
    let dataset = this.state.classifier.getClassifierDataset()
    var datasetObj = {}
    Object.keys(dataset).forEach((key) => {
      let data = dataset[key].dataSync();
      // use Array.from() so when JSON.stringify() it covert to an array string e.g [0.1,-0.2...] 
      // instead of object e.g {0:"0.1", 1:"-0.2"...}
      datasetObj[key] = Array.from(data);
    });


    await axios.post('http://localhost:80/api/updatemodel', { [classId]: datasetObj[classId] })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });


  };

  load = async () => {

    var tempClassifier = this.state.classifier;
    //can be change to other source
    await axios.get('http://localhost:80/api/getmodel')
      .then(function (response) {
        try {
          let tensorObj = response.data
          //covert back to tensor
          Object.keys(tensorObj).forEach((key) => {
            tensorObj[key] = tf.tensor(tensorObj[key], [tensorObj[key].length / 1024, 1024])
          })
          tempClassifier.setClassifierDataset(tensorObj);
        }
        catch (error) {
          console.log(error)

        }
      })
      .catch(function (error) {
        console.log(error);
      });

    this.setState({
      classifier: tempClassifier,
    })
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

          <div id="console"></div>
        </div>
    )
  }

}

export default Webcam;
