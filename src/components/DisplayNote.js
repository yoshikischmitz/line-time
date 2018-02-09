import React from 'react'
import Chunk from '../containers/Chunk'

export default ({chunks}) => (
	<div>
		{
			chunks.map((id, index) => {
				let first = false
				let last = false
				if(index === 0){
					first = true;
				}
				if(index + 1 === chunks.length){
					last = true;
				}
				return <Chunk id={id} first={first} last={last}/>
			})
		}
	</div>
)
