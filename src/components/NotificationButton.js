import React from 'react'
import {connect} from 'react-redux'
import {requestNotifications} from '../actions'

const notificationButton = ({enabled, onClick}) => {
	if(enabled){
		return(<a onClick={() => new Notification("Notifications are working!")}className="notification-button enabled">Notifications enabled</a>)
	} else {
		return(<a className="notification-button disabled" onClick={onClick}>Enable notifications</a>)
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
