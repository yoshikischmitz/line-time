import React from 'react'

const hour = 60 * 60
const minute = 60
export default ({seconds}) => {
	let hours = Math.floor(seconds/hour)
	seconds = seconds - (hours * hour)
	let minutes = Math.floor(seconds/minute)
	seconds = seconds - (minutes * minute)

	return(<div>{ hours } : { minutes} : { seconds }</div>)
}
