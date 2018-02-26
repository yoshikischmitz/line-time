import React from 'react'

export default ({first, last, complete, prevComplete}) => {
	const completeStyle = (complete) => (complete ? "complete" : "")
	const firstStyle = first ? "first" : ""
	const lastStyle = last ? "last" : ""
	const style = (name, complete) => `timeline-${name} ${firstStyle} ${lastStyle} ${completeStyle(complete)}`
	return(
		<div className="timeline">
			<div className={style('top', prevComplete)}></div>
			<div className={complete ? "bullet complete" : "bullet"} >
				<div className="inner">
				</div>
			</div>
			<div className={style('bottom', complete)} ></div>
		</div>
	)
}
