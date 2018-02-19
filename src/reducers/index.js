import uuid from 'uuid'
import {EditorState, ContentState, Modifier, CompositeDecorator, SelectionState} from 'draft-js'
import {Record} from 'immutable'
import {UpdateChunk, AddChunk, MergeChunkUp, StartTimer, Tick, Focus, GotPermission, MoveFocusUp, MoveFocusDown, MoveChunk} from '../actions/types'
import { blocksFromSelection, selectTillEnd, appendBlocks, insertTextAtCursor, blocksToString } from '../utils/draftUtils'
import {parseTime, firstLineStrategy, firstLineSpan} from '../utils'

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

function addChunk(state, action){
	const intervalContent = action.intervalContent
	const intervalSeconds = action.intervalSeconds
	const oldChunk = state.chunks[action.id]
	const editorState = action.editorState
	const currentContent = editorState.getCurrentContent()
	const currentSelection = editorState.getSelection()

	if(oldChunk.intervalContent.length === 0){
		const intervalRemovalSelection = currentSelection.merge({anchorOffset: 0})
		const oldChunkContent = Modifier.removeRange(currentContent, intervalRemovalSelection, 'backward')
		const newEditorState = EditorState.push(editorState, oldChunkContent, 'new-chunk')
		const oldChunkUpdate = Object.assign({}, oldChunk, {editorState: newEditorState, intervalContent: intervalContent, intervalSeconds: intervalSeconds})
		const chunksUpdate = Object.assign({}, state.chunks, {[action.id]: oldChunkUpdate})
		let update = {}
		if(state.currentChunk === action.id){
			update.timerSeconds = intervalSeconds
		}
		return Object.assign({}, state, update, {chunks: chunksUpdate})
	} else {

    const endSelection = selectTillEnd(editorState)
		// 2. the old chunk should have the end selection text removed
		const oldChunkContent = Modifier.removeRange(currentContent, endSelection, 'backward')
		const oldChunkEditor = EditorState.push(editorState, oldChunkContent, 'new-chunk')
		const oldChunkUpdate = Object.assign({}, oldChunk, { editorState: oldChunkEditor })

		// 3. the new chunk should have the end selection as its text:
		const newChunkSelection = endSelection.merge({
			anchorKey: currentSelection.getAnchorKey(),
			anchorOffset: intervalContent.length
		})

		const newChunkId = uuid()
		const subsetBlocks = blocksFromSelection(currentContent, newChunkSelection)
		const newChunkContent = currentContent.set('blockMap', subsetBlocks)
		const newChunkEditor = EditorState.createWithContent(newChunkContent)
	  const editorWithDecorator = EditorState.set(newChunkEditor, {decorator: compositeDecorator})

		const newChunk = {
			editorState: editorWithDecorator,
			intervalContent: intervalContent,
			intervalSeconds: intervalSeconds
		}

		const chunksUpdate = Object.assign({}, state.chunks, {
			[newChunkId] : newChunk,
			[action.id] : oldChunkUpdate
		})

		// update the note:
		const currentNote = state.notes[state.currentNote]
		const newChunks = insertAt(currentNote.chunks, action.id, newChunkId, 1)

		return {
			...state, 
			notes: updateCurrentNote(state, {chunks: newChunks}), 
			chunks: chunksUpdate, focus: newChunkId
		}
	}
}

function removeChunk(note, index){
	const chunks = Object.assign([], note.chunks)
  chunks.splice(index, 1)
	return chunks
}

function mergeChunks(upperChunk, lowerChunk){
  const lowerChunkWithInterval = insertTextAtCursor(lowerChunk.editorState, lowerChunk.intervalContent)
	const mergedContent = appendBlocks(upperChunk.editorState.getCurrentContent(), lowerChunkWithInterval.getBlockMap())
  const mergedChunk = EditorState.push(upperChunk.editorState, mergedContent, "merge-up")
	const offset = lowerChunk.intervalContent.length
	const selection = lowerChunk.editorState.getSelection().merge({anchorOffset: offset, focusOffset: offset})
	const mergedChunkWithFocus = EditorState.forceSelection(mergedChunk, selection)
	return mergedChunkWithFocus
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

	if(upperChunkIndex >= 0){
		const upperChunkId = currentNote.chunks[upperChunkIndex]
		const upperChunk = state.chunks[upperChunkId]

		const mergedChunk = mergeChunks(upperChunk, currentChunk)
		// 3. update state:
		const newChunk = {...upperChunk, editorState: mergedChunk}

		const noteChunks = removeChunk(currentNote, currentChunkIndex)
		let chunks = {...state.chunks, [upperChunkId] : newChunk}

		delete(chunks[chunkId])

		return {
			...state, 
			chunks: chunks, 
			notes: updateCurrentNote(state, {chunks: noteChunks}),
			focus: upperChunkId
		}
	} else if(currentChunk.intervalContent.length > 0) {
		const editorState = currentChunk.editorState
		const content = editorState.getCurrentContent()
		const selection = editorState.getSelection().merge({anchorKey: content.getFirstBlock().getKey(), focusKey: content.getFirstBlock().getKey(), anchorOffset: 0, focusOffset: 0})
		const contentWithInterval = Modifier.insertText(content, selection, currentChunk.intervalContent )
		const newChunkState = {...currentChunk, editorState: EditorState.push(editorState, contentWithInterval, 'add-chunk-back'), intervalContent: "", intervalSeconds: 0}
		const chunksUpdate = {...state.chunks, [chunkId]: newChunkState}
		return {...state, chunks: chunksUpdate}
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

function selectionAt(selection, key, offset){
	const opts = {hasFocus: true, anchorKey: key, focusKey: key, anchorOffset: offset, focusOffset: offset}
	return SelectionState.createEmpty(key).merge(opts)
}

function moveToEnd(editorState){
	const content = editorState.getCurrentContent()
	const lastBlock = content.getLastBlock()
	const lastKey = lastBlock.getKey()
	const lastBlockLength = lastBlock.getLength()

	return EditorState.forceSelection(editorState, selectionAt(editorState.getSelection(), lastKey, lastBlockLength))
}

function moveToStart(editorState){
	const content = editorState.getCurrentContent()
	const firstBlock = content.getFirstBlock()
	const firstKey = firstBlock.getKey()

	return EditorState.forceSelection(editorState, selectionAt(editorState.getSelection(), firstKey, 0))
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
		if(newFocus){
			let editorUpdate
			if(offset < 0){
				editorUpdate = moveToEnd(newFocusChunk.editorState)
			} else {
				editorUpdate = moveToStart(newFocusChunk.editorState)
			}
			const chunkWithNewSelect = {...newFocusChunk, editorState: editorUpdate}
      return {...state, focus: newFocus, ...state.chunks, [newFocus]: chunkWithNewSelect}
		}
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
