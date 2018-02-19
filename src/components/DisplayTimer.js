import React from 'react'
import CountDown from './CountDown'
import NotificationButton from './NotificationButton'

export default ({seconds, onClick, state}) => (
	<div className="timer">
		<div className="timer-control" onClick={onClick}>
			<div className={state}/>
		</div>
		<CountDown className="countdown" seconds={seconds}/>
		<NotificationButton />
	</div>
)
