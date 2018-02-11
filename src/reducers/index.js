import uuid from 'uuid'
import {EditorState, ContentState, SelectionState, Modifier, convertToRaw} from 'draft-js'
import {UpdateChunk, AddChunk, MergeChunkUp, StartTimer, Tick} from '../actions/types'
import { blocksFromSelection, selectTillEnd, appendBlocks, insertTextAtCursor } from '../utils/draftUtils'
import {parseTime} from '../utils'

let interval

function editorFromText(text){
	const content = ContentState.createFromText(text)
	return EditorState.createWithContent(content)
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
	const chunk2 = uuid()
	const chunk3 = uuid()
	const chunk4 = uuid()

	return {
		currentNote: current,
		currentChunk: chunk3,
		timerSeconds: 3,
		timerActive: false,
		focus: chunk1,
		notes: {
			[current]: {
				chunks: [
					chunk1,
					chunk2,
					chunk3,
					chunk4
				]
			}
		},
		chunks: {
			[chunk1] : chunk("25 minutes", "Suppress revolutionaries\n", true),
			[chunk2] : chunk("5 minutes", "Take a break\ndo some stretches\nwalk around", true),
			[chunk3] : chunk("3 seconds", "Launch a Roadster into space", false),
			[chunk4] : chunk("5 minutes", "Take another break", false)
		}
	}
}

const initialState = generateInitialState()

const blocksToString = bs => bs.map(b => b.getText() ).join("\n")

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

	const editorState = action.editorState

	const currentContent = editorState.getCurrentContent()
	const currentSelection = editorState.getSelection()

	// 1. select till the end of the editor
	const endSelection = selectTillEnd(editorState)
	// 2. the old chunk should have the end selection text removed
	const oldChunk = state.chunks[action.id]
	const oldChunkContent = Modifier.removeRange(currentContent, endSelection, 'backward')
	const oldChunkEditor = EditorState.push(editorState, oldChunkContent, 'new-chunk')
	const oldChunkUpdate = Object.assign({}, oldChunk, { editorState: oldChunkEditor })

	// 3. the new chunk should have the end selection as its text:
	const newChunkSelection = endSelection.merge({
		anchorKey: currentSelection.getAnchorKey(),
		anchorOffset: intervalContent.length + 2
	})

	const newChunkId = uuid()
	const subsetBlocks = blocksFromSelection(currentContent, newChunkSelection)
	const newChunkContent = currentContent.set('blockMap', subsetBlocks)
	const newChunkEditor = EditorState.createWithContent(newChunkContent)

	const newChunk = {
		editorState: newChunkEditor,
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

function removeChunk(note, index){
	const chunks = Object.assign([], note.chunks)
  chunks.splice(index, 1)
	return chunks
}

function mergeChunks(upperChunk, lowerChunk){
  const lowerChunkWithInterval = insertTextAtCursor(lowerChunk.editorState, "[" + lowerChunk.intervalContent + "]")
	const mergedContent = appendBlocks(upperChunk.editorState.getCurrentContent(), lowerChunkWithInterval.getBlockMap())
  const mergedChunk = EditorState.push(upperChunk.editorState, mergedContent, "merge-up")
	const offset = lowerChunk.intervalContent.length + 2
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
	} else {
		return state
	}
}

function toggleTimer(state, action){
	const chunk = state.chunks[state.currentChunk]
	if(state.timerActive){
		return Object.assign({}, state, {timerActive: false})
	} else {
	  return Object.assign({}, state, {timerActive: true})
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
		case(AddChunk):
			return addChunk(state, action)
		case(MergeChunkUp):
			return mergeChunkUp(state, action)
		case(StartTimer):
			return toggleTimer(state, action)
		case(Tick):
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
						newState.timerValid = false
					}
					console.log(newState)
				  return Object.assign({}, state, newState)
				}
			}
		default: {
			return state
		}
	}
	return state
}
