import React from 'react'

const stateMap = {
	'Playing' : 'Pause',
	'Paused' : 'Resume',
	'Stopped' : 'Start',
}

export default ({onStopClick, onStartClick, onSkipClick, state}) => {
	const timerActive = (state === 'Playing' || state === 'Paused')
	return (
		<div className="control-group">
			{ (timerActive) && 
					<div className="timer-control stop" onClick={onStopClick}>Stop
						<div className="icon"></div>
				  </div> 
			}
			<div className="timer-control play" onClick={onStartClick}>
				{ stateMap[state] }
						<div className="icon"></div>
			</div>
			{ 
				(timerActive) && 
					<div className="timer-control skip" onClick={onSkipClick} >
						Skip
						<div className="icon"></div>
					</div> 
			}
		</div>
	)
}
