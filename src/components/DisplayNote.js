import React from 'react'
import Chunk from '../containers/Chunk'
import { Droppable } from 'react-beautiful-dnd';
import Timer from '../containers/Timer'

const dateOptions = { 
	year: 'numeric', 
	month: 'long', 
	day: 'numeric', 
	hour: '2-digit', 
	minute: '2-digit' 
}

export default ({updatedAt, chunks}) => (
	<div className = "note-timer-container">
		<Droppable droppableId="droppable">
			{(provided, snapshot) => (
				<div className="note" ref={provided.innerRef}>
					<div className="note-updated">
						{ updatedAt.toLocaleDateString("en-US", dateOptions) }
					</div>
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
							return <Chunk index={index} id={c.id} prevComplete={c.prevComplete} first={first} last={last}/>
						})
					}
					{provided.placeholder}
				</div>
			)}
		</Droppable>
		<div className="timer-bar">
			<Timer />
		</div>
	</div>
)
