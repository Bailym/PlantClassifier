import React from 'react';
import { Link, withRouter, BrowserRouter as Router } from 'react-router-dom';

class Menu extends React.Component {

    render = () => {
        return (
            <Router>
                <div>
                    <button
                        onClick={() => {
                            this.props.history.push("/webcam")
                            window.location.reload()
                        }}>Live Webcam Feed</button>

                    <button
                        onClick={() => {
                            this.props.history.push("/upload")
                            window.location.reload()
                        }}>Upload Images</button>
                </div>
            </Router>

        )
    }
}

export default withRouter(Menu)