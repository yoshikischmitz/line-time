import React from 'react'
import { Editor } from 'draft-js'

export default ({intervalContent, intervalSeconds, editorState, onChange, beforeInput}) => (
	<div className="chunk">
		<div className="interval">
			{ intervalContent }
		</div>
		<div className="bullet" />
		<div className="editor">
			<Editor 
				editorState={ editorState } 
				onChange={ onChange }
				handleBeforeInput={beforeInput}
			/>
	  </div>
		<div className="bottom-boundary" />
	</div>
)
