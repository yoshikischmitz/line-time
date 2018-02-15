import React, { Component } from 'react';
import '../App.css';
import CurrentNote from '../containers/CurrentNote'
import NotificationButton from '../components/NotificationButton'
import Timer from '../containers/Timer'


class App extends Component {
  render() {
    return (
			<div>
				<NotificationButton />
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
