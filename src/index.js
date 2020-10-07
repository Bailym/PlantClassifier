import React from 'react';
import ReactDOM from 'react-dom';
import Webcam from './Webcam';
import Upload from './components/upload'
import Menu from './menu'
import { BrowserRouter as Router, Route, } from 'react-router-dom';

const routing = (
  <Router>
    <div>
      <Route exact path="/" component={Menu} />
      <Route exact path="/webcam" component={Webcam} />
      <Route exact path="/upload" component={Upload} />

    </div>
  </Router>
)

class Index extends React.Component {

  render =() =>{
    return(
      <Router>
      <div id="content"></div>


    </Router>
    )
    
  }
}

ReactDOM.render(<Index></Index>, document.getElementById("root"))
ReactDOM.render(routing, document.getElementById("content"))

export default Index;