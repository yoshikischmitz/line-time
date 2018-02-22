import React from 'react'
import CountDown from './CountDown'
import NotificationButton from './NotificationButton'

const stateMap = {
	'Playing' : 'Pause',
	'Paused' : 'Resume',
	'Stopped' : 'Start',
}

export default ({seconds, onStartClick, onStopClick, state}) => {
	const timerActive = (state === 'Playing' || state === 'Paused')
	return (
		<div className="control-group">
			{ (timerActive) && <div className="timer-control stop" onClick={onStopClick}>Stop</div> }
			<div className="timer-control play" onClick={onStartClick}>
				{ stateMap[state] }
			</div>
			{ (timerActive) && <div className="timer-control skip">Skip</div> }
		</div>
	)
}
