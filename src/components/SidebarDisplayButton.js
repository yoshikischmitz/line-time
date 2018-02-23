import React from 'react';
import {connect} from 'react-redux'
import {toggleSidebar} from '../actions'
import { Icon } from '@doist/reactist'

const sidebarButton = ({onClick}) => {
	return <Icon onClick={onClick} image="/img/sidebar-toggle.svg" className="sidebar-toggle">yo</Icon>
}

const mapStateToProps = (state, ownProps) => {
	return {
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: () => {
			dispatch(toggleSidebar())
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(sidebarButton)
