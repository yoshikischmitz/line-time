import React from 'react'
import Chunk from '../containers/Chunk'
import { Droppable } from 'react-beautiful-dnd';

export default ({chunks}) => (
  <Droppable droppableId="droppable">
		{(provided, snapshot) => (
			<div ref={provided.innerRef}>
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
						return <Chunk index={index} key={c.id} id={c.id} prevComplete={c.prevComplete} first={first} last={last}/>
					})
				}
				{provided.placeholder}
			</div>
		)}
	</Droppable>
)
