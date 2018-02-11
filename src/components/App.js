import React, { Component } from 'react';
import '../App.css';
import CurrentNote from '../containers/CurrentNote'
import Timer from '../containers/Timer'


class App extends Component {
  render() {
    return (
			<div>
				<div className="App">
					<div className="logo" />
					<CurrentNote />
				</div>
				<Timer />
		  </div>
    );
  }
}

export default App;
