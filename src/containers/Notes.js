import {connect} from 'react-redux'
import React from 'react'
import ClickableNote from './ClickableNote'

const notes = ({notes, onNewNoteClick, displayMobile}) => {
	const className =  `notes ${displayMobile ? "mobile-show" : "mobile-hide" }`
	return(
		<div className={className}>
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
		notes: notes,
		displayMobile: state.showSidebarMobile
	}
}

export default connect(mapStateToProps, null)(notes)
