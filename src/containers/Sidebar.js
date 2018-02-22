import {connect} from 'react-redux'
import React from 'react'
import ClickableNote from './ClickableNote'
import {makeNewNote} from '../actions'

const sidebar = ({notes, onNewNoteClick}) => {
	return(
		<div className="sidebar">
			<button onClick={onNewNoteClick}>New Note</button>
			{ 
				notes.map((note) => <ClickableNote key={note} id={note} />) 
			}
	  </div>
	)
}

const mapStateToProps = (state, ownProps) => {
	const notes = Object.keys(state.notes)

	notes.sort((a, b) => {
		return new Date(state.notes[b].updatedAt) - new Date(state.notes[a].updatedAt)
	})

	return {
		notes: notes
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onNewNoteClick: () => { 
			dispatch(makeNewNote())
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(sidebar)
