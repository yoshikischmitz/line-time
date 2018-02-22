import {connect} from 'react-redux'
import React from 'react'
import ClickableNote from './ClickableNote'

const notes = ({notes, onNewNoteClick}) => {
	return(
		<div className="notes">
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

export default connect(mapStateToProps, null)(notes)
