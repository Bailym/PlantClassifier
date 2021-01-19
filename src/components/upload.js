import React from 'react';
import * as tf from '@tensorflow/tfjs';
import Button from '@material-ui/core/Button';
import ReactDOM from "react-dom";
const knnClassifier = require('@tensorflow-models/knn-classifier');
const mobilenet = require('@tensorflow-models/mobilenet');
const axios = require('axios');
var classNames = require("../classes.json")

class Upload extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            file: '',
            imagePreviewUrl: '',
            net: null,
            classifier: null,
            imgTensor: null,
        };
    }



    componentDidMount = async () => {

        // Load the mobilenet model
        var netInit = await mobilenet.load();
        var classifierInit = knnClassifier.create();


        // Create an object from Tensorflow.js data API which could capture image 
        // from the web camera as Tensor.
        //Create a live webcam feed

        this.setState({
            net: netInit,
            classifier: classifierInit,

        })

        this.load();

        //map the classnames.json to a list of buttons and render them
        var buttons = classNames.map(x => <button key={x.ClassID} className="addLabelButton" onClick={() => this.addExample(x.ClassID)} style={{ height: "50px", display: "inline", margin: "2% 0", width: "100%" }}>{"Label " + x.Name}</button>);
        ReactDOM.render(buttons, document.getElementById("labelButtonsDiv"));

        //disable buttons 
        document.getElementById("classifyButton").disabled = true;
        var addLabelButtons = document.getElementsByClassName("addLabelButton");

        //disable each add label button
        for (var i = 0; i < addLabelButtons.length; i++) {
            addLabelButtons[i].disabled = true;
        }
    }



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

        console.log("Model loaded!")
    }

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
                console.log("Model saved");
            })
            .catch(function (error) {
                console.log("Could not save model...")
                console.log(error);
            });


    };

    addExample = async (classId) => {

        var tempClassifier = this.state.classifier;
        // load the uploaded image.
        const img = await this.state.imgTensor

        // Get the intermediate activation of MobileNet 'conv_preds' and pass that
        // to the KNN classifier.
        const activation = this.state.net.infer(img, 'conv_preds');

        // Pass the intermediate activation to the classifier.
        //Associate this activation function with the selected class
        tempClassifier.addExample(activation, classId);

        this.setState({
            classifier: tempClassifier,
        })

        this.save(classId)
    };


    //Makes the prediction
    _handleSubmit = async (e) => {

        e.preventDefault();

        const im = new Image()
        var fr = new FileReader();
        fr.onload = function () {
            im.src = fr.result;
        }
        fr.readAsDataURL(this.state.file);
        im.onload = async () => {
            const a = tf.browser.fromPixels(im)

            if (this.state.classifier.getNumClasses() > 0) {

                // Get the activation from mobilenet from the uploaded image.
                const activation = this.state.net.infer(a, 'conv_preds');
                // Get the most likely class and confidence from the classifier module.
                const result = await this.state.classifier.predictClass(activation);

                let label = ""; //the label (name) of the plant 
                let confidences = [];   //a list of confidences and assosciated class ids and names
                let confidenceValues = Object.values(result.confidences)    //the raw confidences supplied by the model


                //create a list of confidences with names and ids
                for (var i = 0; i < confidenceValues.length; i++) {
                    for (var j = 0; j < classNames.length; j++) {
                        if (classNames[j].ClassID === i) {
                            label = classNames[j].Name;
                        }
                    }

                    confidences.push({ "ClassID": i, "Name": label, "Confidence": confidenceValues[i]*100 })
                }

                //sort this this in desc by confidence
                confidences.sort(function (a, b) {
                    var keyA = a.Confidence,
                        keyB = b.Confidence;
                    // Compare the 2 dates
                    if (keyA < keyB) return 1;
                    if (keyA > keyB) return -1;
                    return 0;
                });

                //create a component for each confidence value
                let confidenceComponents = [];
                for (let i = 0; i < confidences.length; i++) {
                    confidenceComponents.push(<p key={i}>{confidences[i].Name} : {confidences[i].Confidence + "%"}</p>)
                }

                //render the components
                ReactDOM.render(confidenceComponents, document.getElementById("console"))

                this.setState({
                    imgTensor: a,
                })

                var addLabelButtons = document.getElementsByClassName("addLabelButton")
                //enable each add label button
                for (let i = 0; i < addLabelButtons.length; i++) {
                    addLabelButtons[i].disabled = false;
                }
            }
        }
    }

    _handleImageChange(e) {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];

        reader.onloadend = () => {
            this.setState({
                file: file,
                imagePreviewUrl: reader.result
            });
        }

        reader.readAsDataURL(file)

        document.getElementById("classifyButton").disabled = false;
    }

    render() {
        let { imagePreviewUrl } = this.state;
        let $imagePreview = null;
        if (imagePreviewUrl) {
            $imagePreview = (<img src={imagePreviewUrl} alt="preview" id="previewImg" style={{ width: "100%", height: "auto", border: "3px solid #000" }} />);
        } else {
            $imagePreview = (<div className="previewText" style={{ margin: "30% 30%" }}>Please select an Image for Preview</div>);
        }

        return (
            <div style={{ width: "50%", backgroundColor: "#e3e8e5", margin: "auto" }}>
                <div className="previewComponent" style={{ width: "50%", margin: "auto" }}>
                    <form style={{ width: "100%", padding: "1%" }}>
                        <h1>Upload an Image</h1>
                        <div className="imgPreview" style={{ border: "3px solid #000" }}>
                            {$imagePreview}
                        </div>
                        <input className="fileInput"
                            type="file"
                            onChange={(e) => this._handleImageChange(e)}
                            style={{ margin: "1% 0 1% 0" }} />
                        <hr />
                        <h1>Classify the Image</h1>
                        <button className="submitButton"
                            id="classifyButton"
                            type="submit"
                            style={{ margin: "1% auto", width: "100%", height: "30px" }}
                            onClick={(e) => this._handleSubmit(e)}>Classify Image</button>
                    </form>
                    <div id="console" style={{ width: "100%", margin: "auto", maxHeight:"100px", overflow:"auto" }}></div>
                    <hr />
                    <h1>Label the Image</h1>
                    <div id="labelButtonsDiv" style={{ maxHeight: "200px", overflow: "auto" }}>

                    </div>
                </div>
            </div>
        )
    }
}

export default Upload