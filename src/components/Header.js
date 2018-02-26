import {connect} from 'react-redux'
import React from 'react'
import { Icon } from '@doist/reactist'
import {makeNewNote} from '../actions'
import SidebarDisplayButton from './SidebarDisplayButton'

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onNewNoteClick: () => { 
			dispatch(makeNewNote())
		},
	}
}

const header = ({onNewNoteClick}) => (
	<div className="header">
		<div className="control-group">
			<SidebarDisplayButton />
			<Icon className="plus" onClick={onNewNoteClick} image="/img/plus.svg" />
			<Icon className="trash-can" onClick={onNewNoteClick} image="/img/trash-can.svg" />
	  </div>
		<img alt="Linetime" className="logo" src="/img/header-logo.svg" />
	</div>
)

export default connect(null, mapDispatchToProps)(header)
