import React from 'react'

export default ({title, contentPreview, onClick}) => {
	return(
		<div className="sidebar-note" onClick={onClick}> 
			<h2>{title}</h2>
			<p>{contentPreview}</p>
		</div>
	)
}
