import React from 'react'
import {Time} from '@doist/reactist'

export default ({title, contentPreview, onClick, highlight, time}) => {
	let className = "note-preview"

	if(highlight){
		className = className + " current"
	}

  const unixTime = parseInt(time/ 1000).toFixed(0)

	return(
		<div className={className} onClick={onClick}> 
			<div className="contents" >
				<div className="title" >{title}</div> 
				
				<div className="body" >
					<Time className="time" time={ unixTime } />
					{contentPreview}
				</div>
		  </div>
		</div>
	)
}
