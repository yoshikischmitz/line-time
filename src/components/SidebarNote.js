import React from 'react'

export default ({title, contentPreview, onClick, highlight}) => {
	let className = "sidebar-note"

	if(highlight){
		className = className + " highlight"
	}

	return(
		<div className={className} onClick={onClick}> 
			<div className="sidebar-note-inner" >
				<div className="title" >{title}</div>
				<div className="preview" >{contentPreview}</div>
		  </div>
		</div>
	)
}
