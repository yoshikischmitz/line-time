import uuid from 'uuid'

import {
	EditorState, 
	ContentState, 
	Modifier, 
	CompositeDecorator, 
	SelectionState
} from 'draft-js'

import {
	UpdateChunk, 
	AddChunk, 
	MergeChunkUp, 
	StartTimer, 
	Tick, 
	Focus, 
	GotPermission, 
	MoveFocusUp, 
	MoveFocusDown, 
	MoveChunk
} from '../actions/types'

import { 
	blocksFromSelection, 
	selectTillEnd, 
	appendBlocks, 
	insertTextAtCursor, 
	blocksToString,
	moveToEnd,
	moveToStart,
	mergeEditors,
	splitEditor,
	removeTextBeforeCursor
} from '../utils/draftUtils'

import {
	parseTime, 
	firstLineStrategy, 
	firstLineSpan
} from '../utils'

const compositeDecorator = new CompositeDecorator([
	{
		strategy: firstLineStrategy,
		component: firstLineSpan
	}
])

function editorFromText(text){
	const content = ContentState.createFromText(text)
	const editorState =  EditorState.createWithContent(content)
	return EditorState.set(editorState, {decorator: compositeDecorator})
}

function emptyChunk(){
	return {
		intervalContent: "",
		intervalSeconds: 0,
		complete: false,
		editorState: EditorState.createEmpty()
	}
}

function chunk(intervalText, text, complete){
	return {
		intervalContent: intervalText,
		intervalSeconds: parseTime(intervalText),
		complete: complete,
		editorState: editorFromText(text)
	}
}

function generateInitialState(){
	const current = uuid()
	const chunk1 = uuid()

	return {
		notificationsEnabled: Notification.permission === 'granted',
		currentNote: current,
		currentChunk: chunk1,
		timerSeconds: 0,
		timerActive: false,
		focus: chunk1,
		notes: {
			[current]: {
				chunks: [
					chunk1,
				]
			}
		},
		chunks: {
			[chunk1] : chunk("", "", false),
		}
	}
}

const initialState = generateInitialState()

function insertAt(arr, findObj, insertObj, offset){
  const index = arr.indexOf(findObj)
  const left = arr.slice(0, index + offset)
  const right = arr.slice(index + offset, arr.length)
  const newArr = left.concat([insertObj], right)
  return newArr
}

// TODO change to acceptInterval
function addChunk(state, action){
	const intervalContent = action.intervalContent
	const intervalSeconds = action.intervalSeconds
	const chunk = state.chunks[action.id]
	const editorState = action.editorState
	const currentContent = editorState.getCurrentContent()

	if(chunk.intervalContent.length === 0){
		return {
			...state, 
			timerSeconds: intervalSeconds, 
			chunks: {
				...state.chunks,
				[action.id] : {
					...chunk,
					editorState: removeTextBeforeCursor(editorState),
					intervalContent: intervalContent,
					intervalSeconds: intervalSeconds
				}
			}
		}
	} else {
		const {top, bottom} = splitEditor(editorState, editorState.getCurrentSelection().getAnchorKey())

		const newChunkId = uuid()
		const newChunkContent = currentContent.set('blockMap', bottom)
		const newChunkEditor = EditorState.createWithContent(newChunkContent)
	  const editorWithDecorator = EditorState.set(newChunkEditor, {decorator: compositeDecorator})

		const newChunks = insertAt(state.notes[state.currentNote].chunks, action.id, newChunkId, 1)

    const upperEditor = moveToEnd(EditorState.push(editorState, currentContent.set('blockMap', top), 'new-chunk'))
    const lowerEditor = moveToStart(removeTextBeforeCursor(EditorState.push(editorState, currentContent.set('blockMap', bottom), 'new-chunk')))

		return {
			...state, 
			notes: updateCurrentNote(state, {chunks: newChunks}), 
			chunks: {
				...state.chunks,
				[action.id] : {
					...chunk,
					editorState: upperEditor
				},
				[newChunkId]: {
					editorState: lowerEditor,
					intervalContent: intervalContent,
					intervalSeconds: intervalSeconds
				}
			}, 
			focus: newChunkId
		}
	}
}

function removeChunk(note, index){
	const chunks = [...note.chunks]
  chunks.splice(index, 1)
	return chunks
}

function updateCurrentNote(state, update){
	return {
		...state.notes,
		[state.currentNote]: {
			...state.notes[state.currentNote],
			...update
		}
	}
}

function mergeChunkUp(state, action){
	const currentNote = state.notes[state.currentNote]
	const chunkId = action.id
	const currentChunk = state.chunks[chunkId]
	const currentChunkIndex = currentNote.chunks.indexOf(chunkId)
	const upperChunkIndex = currentChunkIndex - 1

	const editorState = currentChunk.editorState
	const content = editorState.getCurrentContent()
	const selection = editorState.getSelection().merge({anchorKey: content.getFirstBlock().getKey(), focusKey: content.getFirstBlock().getKey(), anchorOffset: 0, focusOffset: 0})
	const contentWithInterval = Modifier.insertText(content, selection, currentChunk.intervalContent )
  const editorWithInterval = EditorState.push(editorState, contentWithInterval, 'add-chunk')

	if(upperChunkIndex >= 0){
		const upperChunkId = currentNote.chunks[upperChunkIndex]
		const upperChunk = state.chunks[upperChunkId]
		const mergedEditor = mergeEditors(upperChunk.editorState, editorWithInterval)
		// 3. update state:
		const noteChunks = removeChunk(currentNote, currentChunkIndex)

		return {
			...state, 
			chunks: {
				...state.chunks,
				[upperChunkId] : {
					...upperChunk,
					editorState: mergedEditor
				}
			}, 
			notes: updateCurrentNote(state, {chunks: removeChunk(currentNote, currentChunkIndex)}),
			focus: upperChunkId
		}
	} else if(currentChunk.intervalContent.length > 0) {
		return {
			...state, 
			chunks: {
				...state.chunks,
				[chunkId]: {
					...currentChunk,
					editorState: editorWithInterval,
					intervalContent: "",
					intervalSeconds: 0
				}
			}
		}
	}
	return state
}

function toggleTimer(state, action){
	if(state.timerActive){
		return {...state, timerActive: false}
	} else {
	  return {...state, timerActive: true}
	}
}

function moveFocus(state, offset){
	const note = state.notes[state.currentNote]
	const chunk = state.chunks[state.focus]

	if(note.chunks.length <= 1){
		return state
	}

	const chunkIndex = note.chunks.indexOf(state.focus)
  const newIndex = chunkIndex + offset

	if(0 <= newIndex <= note.chunks.length){
		const newFocus = note.chunks[newIndex]
		const newFocusChunk = state.chunks[newFocus]

		let editorUpdate
		if(offset < 0){
			editorUpdate = moveToEnd(newFocusChunk.editorState)
		} else {
			editorUpdate = moveToStart(newFocusChunk.editorState)
		}

		const chunkWithNewSelect = {...newFocusChunk, editorState: editorUpdate}

		return {...state, focus: newFocus, ...state.chunks, [newFocus]: chunkWithNewSelect}
	}
	return state
}

function moveChunk(state, id, index){
	const note = state.notes[state.currentNote]
	const indexOfDragged = note.chunks.indexOf(id)

	const chunks = note.chunks.reduce((memo, x, chunkIndex) => {
		if(chunkIndex === indexOfDragged){
			return memo
		}
		if(chunkIndex === index){
			if(chunkIndex < indexOfDragged){
				return memo.concat(id, x)
			} else {
				return memo.concat(x, id)
			}
		}
		return memo.concat(x)
	}, [])

	return {
		...state, 
		notes: updateCurrentNote(state, {chunks: chunks})
	}
}

function updateChunk(state, id, editorState){
	return {
		...state,
		chunks: {
			...state.chunks, 
			[id]: {
				...state.chunks[id], 
				editorState: editorState
			}
		}
	}
}

function endTimer(state) {
	// get next chunk, make a notification for it, set it to be current
	const currentChunk = state.currentChunk
	const currentChunkIndex = state.notes[state.currentNote].chunks.indexOf(currentChunk)
	const note = state.notes[state.currentNote]

	let text = ""
	let nextChunkId
	let nextChunk = {}
	let noteUpdate = {}
	let timerValid = false

	if(currentChunkIndex + 1 < note.chunks.length ){
		nextChunkId = note.chunks[currentChunkIndex + 1]
		nextChunk = state.chunks[nextChunkId]
		text = nextChunk.editorState.getCurrentContent().getFirstBlock().getText().split("\n")[0]
		timerValid = true
	} else {
		nextChunkId = uuid()
		nextChunk = emptyChunk()
		noteUpdate = {chunks: note.chunks.concat([nextChunkId])}
		text = "wowee you're out of stuff to do!"
	}

  new Notification(text)

	return {
		...state, 
		timerActive: false,
		timerSeconds: nextChunk.intervalSeconds,
		currentChunk: nextChunkId,
		focus: nextChunkId,
		timerValid: timerValid, // get rid of this
		notes: updateCurrentNote(state, noteUpdate),
		chunks: {
			...state.chunks, 
			[currentChunk]: {
				...state.chunks[currentChunk],
				complete: true
			},
			[nextChunkId] : nextChunk
		}
	}
}

function tick(state){
	if(!state.timerActive){
		return state
	}

	if(state.timerSeconds > 0){
		return {...state, timerSeconds: state.timerSeconds - 1}
	}

	return endTimer(state)
}

export default (state = initialState, action) => {
	switch(action.type){
		case(UpdateChunk): {
			return updateChunk(state, action.id, action.editorState)
		}
		case(AddChunk):{
			return addChunk(state, action)
		}
		case(MergeChunkUp):{
			return mergeChunkUp(state, action)
		}
		case(StartTimer):{
			return toggleTimer(state, action)
		}
		case(Tick): {
			return tick(state)
		}
		case(Focus):{
			return {...state, focus: action.id}
		}
		case(GotPermission):{
			return {...state, notificationsEnabled: true}
		}
		case(MoveFocusUp):{
			return moveFocus(state, -1)
		}
		case(MoveFocusDown):{
			return moveFocus(state, 1)
		}
		case(MoveChunk):{
			return moveChunk(state, action.id, action.index)
		}
		default: {
			return state
		}
	}
}
