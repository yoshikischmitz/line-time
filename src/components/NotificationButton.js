import React from 'react'
import {connect} from 'react-redux'
import {requestNotifications} from '../actions'

const notificationButton = ({enabled, onClick}) => {
	if(enabled){
		return(<div onClick={() => new Notification("Notifications are working!")}className="notification-button enabled"></div>)
	} else {
		return(<div className="notification-button disabled" onClick={onClick}></div>)
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
