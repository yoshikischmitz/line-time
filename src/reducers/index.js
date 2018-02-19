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
		const noteUpdate = Object.assign({}, currentNote, {chunks: newChunks})

		const notesUpdate = Object.assign({}, state.notes, {
			[state.currentNote] : noteUpdate
		})

		return Object.assign({}, state, {notes: notesUpdate, chunks: chunksUpdate, focus: newChunkId})
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
		const newChunk = Object.assign({}, upperChunk, {
			editorState: mergedChunk
		})

		const newArr = removeChunk(currentNote, currentChunkIndex)
		const newNote = Object.assign({}, state.notes[state.currentNote], {chunks: newArr})

		let chunks = Object.assign({}, state.chunks, {[upperChunkId] : newChunk})
		delete(chunks[chunkId])

		const notes = Object.assign({}, state.notes, {[state.currentNote] : newNote})
		const newState = Object.assign({}, state, {chunks: chunks}, {notes: notes}, {focus: upperChunkId})

		return newState
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
		return Object.assign({}, state, {timerActive: false})
	} else {
	  return Object.assign({}, state, {timerActive: true})
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
	const chunks = [...note.chunks]
	const indexOfDragged = chunks.indexOf(id)
	chunks.splice(indexOfDragged, 1)
	chunks.splice(index, 0, id)
	const noteUpdate = {...note, chunks: chunks}
	const notesUpdate = {...state.notes, [state.currentNote]: noteUpdate}
	return {...state, notes: notesUpdate}
}

function updateChunk(state, id, editorState){
	const chunk = state.chunks[id]
	const chunkUpdate = {editorState: editorState}
	const newChunk = Object.assign({}, state.chunks[id], chunkUpdate)
	const newChunks =  Object.assign({}, state.chunks, {[id]: newChunk})
	return Object.assign({}, state, {chunks: newChunks})
}

function tick(state){
	if(state.timerActive){
		if(state.timerSeconds > 0){
			return Object.assign({}, state, {timerSeconds: state.timerSeconds - 1})
		} else {
			// get next chunk, make a notification for it, set it to be current
			const currentChunk = state.currentChunk
			const chunks = state.notes[state.currentNote].chunks
			const currentChunkIndex = state.notes[state.currentNote].chunks.indexOf(state.currentChunk)

			const chunkUpdate = Object.assign({}, state.chunks[currentChunk], {complete: true})
			const chunksUpdate = Object.assign({}, state.chunks, {[currentChunk]:chunkUpdate})

			let newState = {
				timerActive: false,
				chunks: chunksUpdate
			}

			if(currentChunkIndex  + 1 < chunks.length ){
				const nextChunk = chunks[currentChunkIndex + 1]
				const text = state.chunks[nextChunk].editorState.getCurrentContent().getFirstBlock().getText().split("\n")[0]
				new Notification(text)
				newState.timerValid = true
				newState.timerSeconds = state.chunks[nextChunk].intervalSeconds
				newState.currentChunk = nextChunk
			} else {
				new Notification("Wowee! You're out of stuff to do!")
				// make a new chunk
				const newChunkId = uuid()
				newState.chunks[newChunkId] = emptyChunk()
				// assign that chunk to the note
				const currentNote = state.notes[state.currentNote]
				const newChunks = currentNote.chunks.concat([newChunkId])
				const currentNoteUpdate = Object.assign({}, currentNote, {chunks: newChunks})
				newState.notes = Object.assign({}, state.notes, {[state.currentNote]: currentNoteUpdate})
				newState.currentChunk = newChunkId
				newState.timerValid = false
			}
			return Object.assign({}, state, newState)
		}
	}
	return state
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
