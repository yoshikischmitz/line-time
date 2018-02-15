import React from 'react'
import {connect} from 'react-redux'
import {requestNotifications} from '../actions'

const notificationButton = ({enabled, onClick}) => {
	if(enabled){
	  return(<div>grey button</div>)
	} else {
		return(<div onClick={onClick}>enable notifications</div>)
	}
}

const mapStateToProps = (state, ownProps) => {
	return {enabled: state.notificationsEnabled}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: (enabled) => {
			dispatch(requestNotifications())
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(notificationButton)
