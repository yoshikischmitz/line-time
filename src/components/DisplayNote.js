import React from 'react'
import Chunk from '../containers/Chunk'
import { Droppable } from 'react-beautiful-dnd';
import NotificationButton from './NotificationButton'

const dateOptions = { 
	year: 'numeric', 
	month: 'long', 
	day: 'numeric', 
	hour: '2-digit', 
	minute: '2-digit' 
}

function className(isDropping){
	return "note " + (isDropping ? "dropping" : "")
}

export default ({updatedAt, chunks, id}) => (
	<div className = "note-timer-container">
		<Droppable droppableId={id}>
			{(provided, snapshot) => (
				<div className={className(snapshot.isDraggingOver)} ref={provided.innerRef}>
					<div className="note-header">
						<div className="note-updated">
							{ updatedAt.toLocaleDateString("en-US", dateOptions) }
						</div>
						<NotificationButton />
					</div>
					{
						chunks.map((chunkId, index) => {
							const previous = chunks[index - 1]
							const next = chunks[index + 1]
							return <Chunk key={chunkId} id={chunkId} noteId={id} index={index} previous={previous} next={next} />
						})
					}
					{provided.placeholder}
				</div>
			)}
		</Droppable>
	</div>
)
