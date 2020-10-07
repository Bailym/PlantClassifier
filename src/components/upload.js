import React from 'react';
import * as tf from '@tensorflow/tfjs';

class Upload extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            file: '',
            imagePreviewUrl: ''
        };
    }

    _handleSubmit(e) {
        e.preventDefault();
        // TODO: do something with -> this.state.file
        console.log('handle uploading-', this.state.file);

        const im = new Image()
        var fr = new FileReader();
        fr.onload = function () {
            im.src = fr.result;
        }
        fr.readAsDataURL(this.state.file);
        im.onload = () => {
            const a = tf.browser.fromPixels(im)
            console.log(a);
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
            </div>
        )
    }
}

export default Upload