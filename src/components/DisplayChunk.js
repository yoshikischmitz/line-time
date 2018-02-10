import React from 'react'
import { Editor } from 'draft-js'

function linearGradient(direction, color) {
  return `linear-gradient(to ${ direction }, ${ color } 60%, rgba(0, 0, 0, 0)) 1 100%`
}

export default ({intervalContent, intervalSeconds, editorState, onChange, keyBindingFn, handleKeyCommand, complete, first, last}) => {
	const color = "grey"

	let style = {
		borderLeft: `solid ${ color } 3px`
	}

	if(first){
	  style.borderImage = linearGradient("top", color)
	} else if(last){
	  style.borderImage = linearGradient("bottom", color)
	}

	if(complete){
		style.color = "#BDBDBD",
		style.textDecoration = "line-through"
	}

	return(
		<div className="chunk" style={style}>
			<div className="interval" style={complete ? {textDecoration: "line-through"} : {}}>
				{ intervalContent }
			</div>
			<div className="bullet" />
			<div className="editor">
				<Editor 
					editorState={ editorState } 
					onChange={ onChange }
					keyBindingFn={(e) => keyBindingFn(e, editorState)}
					handleKeyCommand={(command) => handleKeyCommand(command, editorState)}
				/>
			</div>
			<div className="bottom-boundary" />
		</div>
	)
}
