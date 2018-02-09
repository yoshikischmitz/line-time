import React from 'react'
import Chunk from '../containers/Chunk'

export default ({chunks}) => (
	<div>
		{
			chunks.map((id) => <Chunk id={id} />)
		}
	</div>
)
