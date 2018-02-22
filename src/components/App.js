import React, { Component } from 'react';
import {connect} from 'react-redux'
import '../App.css';
import CurrentNote from '../containers/CurrentNote'
import Notes from '../containers/Notes'
import NotificationButton from '../components/NotificationButton'
import Timer from '../containers/Timer'
import { DragDropContext } from 'react-beautiful-dnd';
import { moveChunk } from '../actions'

class App extends Component {
  render() {
    return (
			<div class="app">
				<Notes />
				<DragDropContext  onDragEnd={this.props.onDragEnd}>
					<CurrentNote />
			  </DragDropContext>
		  </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onDragEnd: (result) => {
			if(result.destination){
				dispatch(moveChunk(result.draggableId, result.destination.index))
			}
		}
	}
}

export default connect(null, mapDispatchToProps)(App)
