import React from 'react'
import { Editor } from 'draft-js'

export default ({intervalContent, intervalSeconds, editorState, onChange, beforeInput}) => (
	<div>
		<div>
			{ intervalContent }
		</div>
		<div>
			<Editor 
				editorState={ editorState } 
				onChange={ onChange }
				handleBeforeInput={beforeInput}
			/>
	  </div>
	</div>
)
