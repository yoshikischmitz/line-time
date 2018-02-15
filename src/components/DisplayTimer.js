import React from 'react'
import CountDown from './CountDown'
import NotificationButton from './NotificationButton'

export default ({seconds, onClick, active}) => (
	<div className="timer">
		<div className="timer-control" onClick={onClick}>
			<div className={ active ? "pause" : "play"}/>
		</div>
		<CountDown className="countdown" seconds={seconds}/>
		<NotificationButton />
	</div>
)
