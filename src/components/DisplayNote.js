import React from 'react'
import Chunk from '../containers/Chunk'

export default ({chunks}) => (
	<div>
		{
			chunks.map((c, index) => {
				let first = false
				let last = false
				if(index === 0){
					first = true;
				}
				if(index + 1 === chunks.length){
					last = true;
				}
				return <Chunk id={c.id} prevComplete={c.prevComplete} first={first} last={last}/>
			})
		}
	</div>
)
