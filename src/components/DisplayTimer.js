import React from 'react'
import CountDown from './CountDown'

export default ({seconds, onClick}) => (
	<div className="timer">
		<button onClick={onClick}>
			Hi
		</button>
		<CountDown seconds={seconds}/>
	</div>
)
