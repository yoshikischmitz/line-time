import {
	EditorState, 
} from 'draft-js'

import { 
	insertTextAtCursor, 
	moveToEnd,
	moveToStart,
	mergeEditors,
	splitEditor,
	removeTextBeforeCursor
} from '../utils/draftUtils'

import {
	compositeDecorator,
	emptyChunk
} from '../utils'

import {
	AddChunk, 
	UpdateChunk, 
	MergeChunkUp, 
	MoveFocus,
	MakeNewNote,
	ChangeInterval
} from '../actions/types'

function addChunk(state, action){
	const chunk = state[action.id]
	const editorState = action.editorState
	const {top, bottom} = splitEditor(editorState, editorState.getSelection().getAnchorKey())
	const currentContent = editorState.getCurrentContent()

	const newChunkId = action.newChunkId
	const bottomContent = currentContent.set('blockMap', bottom)
	const bottomEditor = EditorState.createWithContent(bottomContent)
	const bottomWithFocus = EditorState.forceSelection(bottomEditor, editorState.getSelection())
	const bottomWithDecorator = EditorState.set(bottomWithFocus, {decorator: compositeDecorator})

	const upperEditor = moveToEnd(EditorState.push(editorState, currentContent.set('blockMap', top), 'new-chunk'))

	const lowerEditor = moveToStart(removeTextBeforeCursor(bottomWithDecorator))

	return {
		...state,
		[action.id] : {
			...chunk,
			editorState: upperEditor
		},
		[newChunkId]: {
			editorState: lowerEditor,
			intervalContent: action.intervalContent,
			intervalSeconds: action.intervalSeconds,
			complete: false
		}
	}
}

function updateChunk(state, action){
	const id = action.chunkId
	const editorState = action.editorState

	return {
		...state, 
		[id]: {
			...state[id], 
			editorState: editorState
		}
	}
}

function mergeChunkUp(state, action){
	const chunkId = action.chunkId
	const upperChunkId = action.upperChunkId
	const currentChunk = state[chunkId]
	const editorState = currentChunk.editorState

	// extract this:
	const contentWithInterval = insertTextAtCursor(editorState, "[" + currentChunk.intervalContent + "]")
  const editorWithInterval = EditorState.push(editorState, contentWithInterval, 'add-chunk')

	if(upperChunkId){
		const upperChunk = state[upperChunkId]
		const mergedEditor = mergeEditors(upperChunk.editorState, editorWithInterval)

		return {
			...state, 
			[upperChunkId] : {
				...upperChunk,
				editorState: mergedEditor
			},
			[chunkId]: null
		}
	} else if(currentChunk.intervalContent.length > 0) {

		return {
			...state,
			[chunkId]: {
				...currentChunk,
				editorState: editorWithInterval,
				intervalContent: "",
				intervalSeconds: 0
			}
		}
	}
	return state
}

function changeInterval(state, action){
	const intervalContent = action.intervalContent
	const intervalSeconds = action.intervalSeconds
	const chunk = state[action.id]
	const editorState = action.editorState

	return {
		...state,
		[action.id] : {
			...chunk,
			editorState: removeTextBeforeCursor(editorState),
			intervalContent: intervalContent,
			intervalSeconds: intervalSeconds
		}
	}
}

export default (state = {}, action) => {
	switch(action.type){
	  case(AddChunk): {
			return addChunk(state, action)
		}
		case(UpdateChunk): {
			return updateChunk(state, action)
		}
		case(MergeChunkUp): {
			return mergeChunkUp(state, action)
		}
	  case(ChangeInterval):{
			return changeInterval(state, action)
		}
		case(MakeNewNote):{
		  return {...state, [action.chunkId] : emptyChunk()}
		}
		case(MoveFocus): {
			let func
			if(action.up){
				func = moveToEnd
			} else {
				func = moveToStart
			}

			const focusChunk = state[action.to]
			const editorUpdate = func(focusChunk.editorState)
			return {...state, [action.to]: {...focusChunk, editorState: editorUpdate}}
		}
		default:{
			return state
		}
	}
}
