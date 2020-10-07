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


    _handleSubmit = async (e) => {

        e.preventDefault();
        // TODO: do something with -> this.state.file
        console.log('handle uploading-', this.state.file);

        const im = new Image()
        var fr = new FileReader();
        fr.onload = function () {
            im.src = fr.result;
        }
        fr.readAsDataURL(this.state.file);
        im.onload = async () => {
            const a = tf.browser.fromPixels(im)
            console.log(a);

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

                // Dispose the tensor to release the memory.
                a.dispose();
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
            $imagePreview = (<img src={imagePreviewUrl} alt="preview" id="previewImg" />);
        } else {
            $imagePreview = (<div className="previewText">Please select an Image for Preview</div>);
        }

        return (
            <div className="previewComponent">
                <form onSubmit={(e) => this._handleSubmit(e)}>
                    <input className="fileInput"
                        type="file"
                        onChange={(e) => this._handleImageChange(e)} />
                    <button className="submitButton"
                        type="submit"
                        onClick={(e) => this._handleSubmit(e)}>Upload Image</button>
                </form>
                <div className="imgPreview">
                    {$imagePreview}
                </div>
                <div id="console"></div>
            </div>
        )
    }
}

export default Upload