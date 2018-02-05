import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import TimerLine from './components/TimerLine'

class App extends Component {
  render() {
    return (
      <div className="App">
				<TimerLine />
      </div>
    );
  }
}

export default App;
