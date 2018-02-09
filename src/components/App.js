import React, { Component } from 'react';
import '../App.css';
import CurrentNote from '../containers/CurrentNote'


class App extends Component {
  render() {
    return (
      <div className="App">
				<CurrentNote />
      </div>
    );
  }
}

export default App;
