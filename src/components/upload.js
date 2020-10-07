import React from 'react';
import * as tf from '@tensorflow/tfjs';
const knnClassifier = require('@tensorflow-models/knn-classifier');
const mobilenet = require('@tensorflow-models/mobilenet');
const axios = require('axios');

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
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });


    };

    addExample = async (classId) => {

        var tempClassifier = this.state.classifier;
        // Capture an image from the web camera.
        const img = await this.state.imgTensor

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

        this.save(classId)
    };


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

                const classes = ['Coffee Arabica', 'Parlour Palm', 'Aloe Vera'];

                //update the front end with the prediction
                document.getElementById('console').innerText = `
                prediction: ${classes[result.label]}\n
                probability: ${result.confidences[result.label]}
              `;

                this.setState({
                    imgTensor: a,
                })
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
    }

    render() {
        let { imagePreviewUrl } = this.state;
        let $imagePreview = null;
        if (imagePreviewUrl) {
            $imagePreview = (<img src={imagePreviewUrl} alt="preview" id="previewImg" style={{width:"100%", height:"100%", borderRadius:"10%"}} />);
        } else {
            $imagePreview = (<div className="previewText" style={{margin:"30% 20%"}}>Please select an Image for Preview</div>);
        }

        return (
            <div style={{ width: "25%", border: "5px solid #000", overflow: "hidden", borderRadius:"25px", backgroundColor:"#792da6" }}>
                <div className="previewComponent" style={{ width: "50%", float: "left", marginRight:"5%" }}>
                    <form onSubmit={(e) => this._handleSubmit(e)} style={{ width: "100%", padding: "1%" }}>
                        <input className="fileInput"
                            type="file"
                            onChange={(e) => this._handleImageChange(e)}
                            style={{ margin: "1% 5%" }} />
                        <div className="imgPreview" style={{ minWidth:"200px", border:"3px solid #000", borderRadius:"25px", minHeight:"200px", margin:"5% 5%" }}>
                            {$imagePreview}
                        </div>
                        <button className="submitButton"
                            type="submit"
                            style={{margin:"1% 5%"}}
                            onClick={(e) => this._handleSubmit(e)}>Upload Image</button>
                            
                    </form>
                </div>
                <div style={{ width: "45%", overflow: "hidden" }}>
                    <div id="console" style={{minHeight:"80px"}}></div>

                    <button id="class-a" onClick={() => this.addExample(0)} style={{ height: "50px", display: "block", margin: "5% 1%", width: "200px" }}>Add Coffee Arabica</button>
                    <button id="class-b" onClick={() => this.addExample(1)} style={{ height: "50px", display: "block", margin: "5% 1%", width: "200px" }}>Add Parlour Palm</button>
                    <button id="class-c" onClick={() => this.addExample(2)} style={{ height: "50px", display: "block", margin: "5% 1%", width: "200px" }}>Add Aloe Vera</button>
                </div>
            </div>
        )
    }
}

export default Upload