import {
	AddChunk, 
	UpdateChunk, 
	MergeChunkUp, 
	StartTimer, 
	SkipTimer,
	StopTimer,
	Tick, 
	Focus, 
	GotPermission, 
	MoveFocus,
	MoveChunk,
	ToggleSidebar,
	ChangeNote,
	MakeNewNote,
	ChangeInterval
} from '../actions/types'

function insertAt(arr, findObj, insertObj, offset){
  const index = arr.indexOf(findObj)
  const left = arr.slice(0, index + offset)
  const right = arr.slice(index + offset, arr.length)
  const newArr = left.concat([insertObj], right)
  return newArr
}

export default function notes(state = {}, action){
	const noteId = action.noteId
	const note = state[noteId]

	switch(action.type){
		case(AddChunk): {
		  const addedChunks = insertAt(note.chunks, action.id, action.newChunkId, 1)
			return {...state, [noteId]: {...note, chunks: addedChunks}}
		}
		case(MergeChunkUp): {
			let mergedChunks = [...note.chunks]
			if(action.upperChunkId){
			  mergedChunks.splice(mergedChunks.indexOf(action.chunkId), 1)
			}
			return {...state, [noteId]: {...note, chunks: mergedChunks}}
		}
		case(MakeNewNote): {
			const newChunk = action.chunkId
			return {
				...state,
				[noteId]: {
					chunks: [newChunk],
					updatedAt: new Date()
				}
			}
		}
		case(MoveChunk): {
			let movedChunks = [...note.chunks]

			const indexOfDragged = movedChunks.indexOf(action.chunkId)

			movedChunks.splice(indexOfDragged, 1)
			movedChunks.splice(action.index, 0, action.chunkId)

			return {
				...state, 
				[noteId] : {
					...note, 
					updatedAt: new Date(), 
					chunks: movedChunks
				}
			}
		}
		case(UpdateChunk): {
			if(action.contentChanged){
				return {
					...state,
					[noteId] : {
						...note,
						updatedAt: new Date()
					}
				}
			} else {
				return state
			}
		}
		default: {
		  return state
		}
	}
}

