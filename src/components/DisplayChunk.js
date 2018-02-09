import React from 'react'
import { Editor } from 'draft-js'

export default ({intervalContent, intervalSeconds, editorState, onChange}) => (
	<div>
		<div>
			{ intervalContent }
		</div>
		<div>
			<Editor 
				editorState={ editorState } 
				onChange={ onChange }
			/>
	  </div>
	</div>
)
