import React from 'react'
import {Time} from '@doist/reactist'

export default ({title, contentPreview, onClick, highlight, time}) => {
	let className = "note-preview"

	if(highlight){
		className = className + " current"
	}

	return(
		<div className={className} onClick={onClick}> 
			<div className="contents" >
				<div className="title" >{title}</div> 
				
				<div className="body" >
					<Time className="time" time={time} />
					{contentPreview}
				</div>
		  </div>
		</div>
	)
}
