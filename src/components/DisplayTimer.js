import React from 'react'
import CountDown from './CountDown'
import NotificationButton from './NotificationButton'

const stateMap = {
	'Playing' : 'Pause',
	'Paused' : 'Start',
	'Stopped' : 'Start',
}

export default ({seconds, onClick, state}) => (
	<div className="timer-control" onClick={onClick}>
		{ stateMap[state] }
	</div>
)
