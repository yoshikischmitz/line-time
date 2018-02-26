import { 
	UpdateChunk, 
	AddChunk, 
	MergeChunkUp, 
	StartTimer, 
	StopTimer,
	SkipTimer,
	Tick, 
	Focus, 
	GotPermission, 
	MoveFocus, 
	MoveChunk,
	ChangeNote,
	MakeNewNote,
	ToggleSidebar,
	ChangeInterval
} from './types'

import uuid from 'uuid'

export function tick(){
	return {
		type: Tick
	}
}

export function updateChunkState(chunkId, noteId, editorState, contentChanged){
	return {
		type: UpdateChunk,
		chunkId: chunkId,
		noteId: noteId,
		editorState: editorState,
		contentChanged: contentChanged
	}
}

export function addChunk(chunkId, noteId, editorState, intervalContent, intervalSeconds){
	return {
		type: AddChunk,
		id: chunkId,
		noteId: noteId,
		newChunkId: uuid(),
		intervalContent: intervalContent,
		intervalSeconds: intervalSeconds,
		editorState: editorState
	}
}

export function changeInterval(chunkId, noteId, editorState, intervalContent, intervalSeconds) {
	return {
		type: ChangeInterval,
		id: chunkId,
		editorState: editorState,
		noteId: noteId,
		intervalContent: intervalContent,
		intervalSeconds: intervalSeconds
	}
}

export function mergeChunkUp(chunkId, upperChunkId, noteId){
	return {
		type: MergeChunkUp,
		chunkId: chunkId,
		upperChunkId: upperChunkId,
		noteId: noteId
	}
}

export function startTimer(){
	return {
		type: StartTimer
	}
}

export function stopTimer(){
	return {
		type: StopTimer
	}
}

export function skipTimer(){
	return {
		type: SkipTimer
	}
}

export function focus(chunkId){
	return {
		type: Focus,
		id: chunkId
	}
}

export function gotPermission(){
	return {
		type: GotPermission
	}
}

export function requestNotifications(){
	return (dispatch) => {
		return Notification.requestPermission().then(result => {
			if(result === 'granted'){
				new Notification("Notifications are working!")
				dispatch(gotPermission())
			}
		})
	}
}

export function moveFocus(to, up){
	return {
		to: to,
		up: up,
		type: MoveFocus
	}
}

export function moveChunk(id, noteId, index){
	return {
		type: MoveChunk,
		chunkId: id,
		noteId: noteId,
		index: index
	}
}

export function changeNote(id){
	return {
		type: ChangeNote,
		id: id
	}
}

export function makeNewNote(){
	return {
		type: MakeNewNote,
		noteId: uuid(),
		chunkId: uuid()
	}
}


export function toggleSidebar(){
	return {
		type: ToggleSidebar
	}
}
