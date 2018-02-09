import uuid from 'uuid'
import {EditorState} from 'draft-js'
import {UpdateChunk} from '../actions/types'

const current = uuid()
const chunk1 = uuid()
const chunk2 = uuid()

const initialState = {
	currentNote: current,
	notes: {
		[current]: {
			chunks: [
				chunk1,
				chunk2
			]
		}
	},
	chunks: {
		[chunk1] : {
			intervalContent: "[25 minutes]",
			intervalSeconds: 1500,
			editorState: EditorState.createEmpty()
		},
		[chunk2] : {
			intervalContent: "[5 minutes]",
			intervalSeconds: 300,
			editorState: EditorState.createEmpty()
		}
	}
}

export default (state = initialState, action) => {
	switch(action.type){
		case(UpdateChunk): {
			const chunkId = action.id
			const chunkUpdate = {editorState: action.editorState}
			const newChunk = Object.assign({}, state.chunks[chunkId], chunkUpdate)
			const newChunks =  Object.assign({}, state.chunks, {[chunkId]: newChunk})
			return Object.assign({}, state, {chunks: newChunks})
		}
		default: {
			return state
		}
	}
	return state
}
