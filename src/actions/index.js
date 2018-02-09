import { UpdateChunk, AddChunk } from './types'

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
		intervalContent: intervalContent,
		intervalSeconds: intervalSeconds,
		editorState: editorState
	}
}
