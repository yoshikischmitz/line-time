import React from 'react'

const hour = 60 * 60
const minute = 60

function padZeroes(num){
	if(num === 0 || num < 10){
		return "0" + num.toString()
	}
	return num
}

export default ({seconds}) => {
	let hours = Math.floor(seconds/hour)
	seconds = seconds - (hours * hour)
	let minutes = Math.floor(seconds/minute)
	seconds = seconds - (minutes * minute)

	return(
		<div className="countdown">
			<div className="countdown-number" >
				{ padZeroes(hours) }
			</div>
			<div className="countdown-colon">
			:
		  </div>
			<div className="countdown-number" >
				{ padZeroes(minutes) }
			</div>
			<div className="countdown-colon">
			:
		  </div>
			<div className="countdown-number" >
				{ padZeroes(seconds) }
			</div>
		</div>
	)
}
