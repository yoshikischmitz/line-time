import { 
	UpdateChunk, 
	AddChunk, 
	MergeChunkUp, 
	StartTimer, 
	Tick, 
	Focus, 
	RequestNotifications, 
	GotPermission, 
	MoveFocusUp, 
	MoveFocusDown, 
	MoveChunk,
	ChangeNote,
	MakeNewNote,
	StopTimer
} from './types'

export function tick(){
	return {
		type: Tick
	}
}
export function updateChunkState(chunkId, editorState){
	return {
		type: UpdateChunk,
		id: chunkId,
		editorState: editorState
	}
}

export function addChunk(chunkId, editorState, intervalContent, intervalSeconds){
	return {
		type: AddChunk,
		id: chunkId,
		intervalContent: "[" + intervalContent + "]",
		intervalSeconds: intervalSeconds,
		editorState: editorState
	}
}

export function mergeChunkUp(chunkId){
	return {
		type: MergeChunkUp,
		id: chunkId
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

export function moveFocusUp(){
	return {
		type: MoveFocusUp
	}
}

export function moveFocusDown(){
	return {
		type: MoveFocusDown
	}
}

export function moveChunk(id, index){
	return {
		type: MoveChunk,
		id: id,
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
		type: MakeNewNote
	}
}
