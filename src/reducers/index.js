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
	SkipTimer,
	StopTimer,
	Tick, 
	Focus, 
	GotPermission, 
	MoveFocusUp, 
	MoveFocusDown, 
	MoveChunk,
	ToggleSidebar,
	ChangeNote,
	MakeNewNote,
	ChangeInterval
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
	firstLineSpan,
  findFirstIncompleteChunk
} from '../utils'

const Playing = 'Playing'
const Paused = 'Paused'
const Stopped = 'Stopped'

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
		editorState: EditorState.set(EditorState.createEmpty(), {decorator: compositeDecorator})
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
	const note2 = uuid()
	const note3 = uuid()

	const chunk1 = uuid()
	const chunk2 = uuid()
	const chunk3 = uuid()
	const chunk4 = uuid()
	const chunk5 = uuid()

	return {
		notificationsEnabled: Notification.permission === 'granted',
		showSidebarMobile: false,
		currentNote: current,
		secondsRemaining: 0,
		timerState: Stopped,
		focus: chunk1,
		notes: {
			[current]: {
				updatedAt: new Date('2017-01-20'),
				chunks: [
					chunk1,
					chunk2,
					chunk3,
				]
			},
			[note2]: {
				updatedAt: new Date('2017-01-20'),
				chunks: [
					chunk4
				]
			},
			[note3] : {
				updatedAt: new Date(),
				chunks: [
					chunk5
				]
			}
		},
		chunks: {
			[chunk1] : chunk("25 minutes", "Lorem ipsum dolor sit amet, consectetuer \nadipiscing elit. Aenean commodo ligula eget dolor", false),
			[chunk2] : chunk("25 minutes", "Aenean massa. Cum sociis \nnatoque penatibus et magnis dis parturient montes", true),
			[chunk3] : chunk("25 mintues", "Donec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam", true),
			[chunk4] : chunk("25 mintues", "DDonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. NullamDonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullamonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, vDonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullamenenatis vitae, justo. Nullam", true),
			[chunk5] : chunk("25 mintues", "Donec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, iDonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. NullamDonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. NullamDonec pede justo, \nfringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullammperdiet a, venenatis vitae, justo. Nullam", true)
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
	const chunkId = action.chunkId
	const upperChunkId = action.upperChunkId
	const currentChunk = state.chunks[chunkId]
	const editorState = currentChunk.editorState

	// extract this:
	const contentWithInterval = insertTextAtCursor(editorState, "[" + currentChunk.intervalContent + "]")
  const editorWithInterval = EditorState.push(editorState, contentWithInterval, 'add-chunk')

	if(upperChunkId){
		const upperChunk = state.chunks[upperChunkId]
		const mergedEditor = mergeEditors(upperChunk.editorState, editorWithInterval)

		return {
			...state, 
			chunks: {
				...state.chunks,
				[upperChunkId] : {
					...upperChunk,
					editorState: mergedEditor
				},
				[chunkId]: null
			}, 
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

function startNextTimer(state){
	const found = findFirstIncompleteChunk(state)
	if(found){
		const seconds = state.chunks[found].intervalSeconds
		if(seconds > 0){
			return {...state, secondsRemaining: state.chunks[found].intervalSeconds, currentChunk: found, timerState: Playing}
		}
	}
	return {...state, timerState: Stopped}
}

function toggleTimer(state, action){
	switch(state.timerState){
		case(Playing):{
		  return {...state, timerState: Paused}
		}
		case(Paused):{
		  return {...state, timerState: Playing}
		}
		case(Stopped):{
			return startNextTimer(state)
		}
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

	if(0 <= newIndex < note.chunks.length){
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

function endTimer(state) {
	// get next chunk, make a notification for it, set it to be current
	const currentChunk = state.currentChunk
	const currentChunkIndex = state.notes[state.currentNote].chunks.indexOf(currentChunk)
	const note = state.notes[state.currentNote]

	let text = ""
	let nextChunkId
	let nextChunk = {}
	let noteUpdate = {}

	if(currentChunkIndex + 1 < note.chunks.length ){
		nextChunkId = note.chunks[currentChunkIndex + 1]
		nextChunk = state.chunks[nextChunkId]
		text = nextChunk.editorState.getCurrentContent().getFirstBlock().getText().split("\n")[0]
	} else {
		nextChunkId = uuid()
		nextChunk = emptyChunk()
		noteUpdate = {chunks: note.chunks.concat([nextChunkId])}
		text = "wowee you're out of stuff to do!"
	}

  new Notification(text)

	return {
		...state, 
		currentChunk: null,
		timerState: Stopped,
		focus: nextChunkId,
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
	if(state.timerState != Playing){
		return state
	}

	if(state.secondsRemaining > 0){
		return {...state, secondsRemaining: state.secondsRemaining - 1}
	}

	return endTimer(state)
}

function chunks(state = {}, action){
	switch(action.type){
	  case(AddChunk): {
			return addChunk(state, action)
		}
		case(UpdateChunk): {
			return updateChunk(state, action)
		}
		default:{
			return state
		}
	}
}


function notes(state = {}, action){
	const noteId = action.noteId
	const note = state[noteId]

	switch(action.type){
		case(AddChunk): {
		  const addedChunks = insertAt(note.chunks, action.id, action.newChunkId, 1)
			return {...state, [noteId]: {...note, chunks: addedChunks}}
		}
		case(MergeChunkUp): {
			let mergedChunks = [...note.chunks]
			mergedChunks.splice(mergedChunks.indexOf(action.chunkId), 1)
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

function changeInterval(state, action){
	const intervalContent = action.intervalContent
	const intervalSeconds = action.intervalSeconds
	const chunk = state.chunks[action.id]
	const editorState = action.editorState

	return {
		...state.chunks,
		[action.id] : {
			...chunk,
			editorState: removeTextBeforeCursor(editorState),
			intervalContent: intervalContent,
			intervalSeconds: intervalSeconds
		}
	}
}

function root(state = {}, action){
	switch(action.type){
		case(AddChunk):{
			return {...state, focus: action.newChunkId}
		}
	  case(ChangeInterval):{
			return {...state, chunks: changeInterval(state, action)}
		}
		case(MergeChunkUp):{
			const newState = {...state, ...mergeChunkUp(state, action)}
			return newState
		}
		case(StartTimer):{
			return toggleTimer(state, action)
		}
		case(StopTimer):{
		  return {...state, currentChunk: null, timerState: Stopped}
		}
		case(SkipTimer) : {
		  return startNextTimer(endTimer(state))
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
		case(ChangeNote):{
			return {...state, currentNote: action.id, showSidebarMobile: false}
		}
		case(MakeNewNote):{
			return {...state, chunks: {...state.chunks, [action.chunkId] : emptyChunk() }, currentNote: action.noteId}
		}
		case(ToggleSidebar):{
			return {...state, showSidebarMobile: !state.showSidebarMobile}
		}
		default: {
			return state
		}
	}
}

export default (state = initialState, action) => {
	const noteUpdate = notes(state.notes, action)
	const chunksUpdate = chunks(state.chunks, action)

	const merged = {...state, notes: noteUpdate, chunks: chunksUpdate}
	const rootUpdate = root(merged, action)

	return rootUpdate
}
