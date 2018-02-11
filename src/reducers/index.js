import uuid from 'uuid'
import {EditorState, ContentState, SelectionState, Modifier, convertToRaw} from 'draft-js'
import {UpdateChunk, AddChunk, MergeChunkUp} from '../actions/types'
import humanInterval from 'human-interval'

function editorFromText(text){
	const content = ContentState.createFromText(text)
	return EditorState.createWithContent(content)
}

function chunk(intervalText, text, complete){
	return {
		intervalContent: intervalText,
		intervalSeconds: humanInterval(intervalText),
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
			[chunk3] : chunk("25 minutes", "Launch a Roadster into space", false),
			[chunk4] : chunk("5 minutes", "Take another break", false)
		}
	}
}

const initialState = generateInitialState()

const blocksToString = bs => bs.map(b => b.getText() ).join("\n")

function blocksFromSelection(contentState, selection){
	const start = selection.getStartKey()
	const end = selection.getEndKey()
	const blocks = contentState.getBlockMap()

	// all the blocks from the start of the selection till the end
	const selectedBlocks = blocks.
		skipUntil(b => b.getKey() === start).
		takeUntil(b => contentState.getKeyBefore(b.getKey()) === end)

	const sliceBlock = (block, start, end) => (
		block.set('text', block.getText().slice(start, end))
	)

	// the start and the end block have unselected text removed,
	// all other blocks are untouched:
	const blocksWithoutUnselectedText = selectedBlocks.map(b => {
		const key = b.getKey()
		if(key === start){
			return sliceBlock(b, selection.getStartOffset(), b.getLength())
		} else if(key === end){
			return sliceBlock(b, 0, selection.getEndOffset())
		} else {
			return b
		}
	})

	return blocksWithoutUnselectedText
}

// builds a selection starting from the end of the block before
// the current one till the end of the document
function selectTillEnd(editorState){
	const contentState = editorState.getCurrentContent()
	const lastBlock = contentState.getLastBlock()

	return editorState.getSelection().merge({
		anchorOffset: 0, 
		focusKey: lastBlock.getKey(), 
		focusOffset: lastBlock.getLength()
	})
}

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

function insertTextAtCursor(editorState, text){
	const selection = editorState.getSelection()
	const content = editorState.getCurrentContent()
	return Modifier.insertText(content, selection, text)
}

function createEndSelection(editorState){
	const content = editorState.getCurrentContent()
	const lastBlock = content.getLastBlock()
	const lastBlockSelection = SelectionState.createEmpty(lastBlock.getKey())
  return lastBlockSelection.merge({
		anchorOffset: lastBlock.getLength(), 
		focusKey: lastBlock.getKey(), 
		focusOffset: lastBlock.getLength()
	})
}

function contentToString(content){
  return convertToRaw(content).blocks.map((x) => x.text).join("\n")
}

function removeChunk(note, index){
	const chunks = Object.assign([], note.chunks)
  chunks.splice(index, 1)
	return chunks
}

function appendBlocks(content, appendedBlocks){
  return content.set('blockMap', content.getBlockMap().merge(appendedBlocks))
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

		// 1. insert interval back into text:
		const newContent = insertTextAtCursor(currentChunk.editorState, "[" + currentChunk.intervalContent + "]")

 		// 2. add the text to the chunk above the current one:
		const updatedChunkContent = appendBlocks(upperChunk.editorState.getCurrentContent(), newContent.getBlockMap())

    const mergedChunk = EditorState.push(upperChunk.editorState, updatedChunkContent, "merge-up")
		const offset = currentChunk.intervalContent.length + 2
		const selection = currentChunk.editorState.getSelection().merge({anchorOffset: offset, focusOffset: offset})
		const mergedChunkWithFocus = EditorState.forceSelection(mergedChunk, selection)

		// 3. update state:
		const newChunk = Object.assign({}, upperChunk, {
			editorState: mergedChunkWithFocus
		})

		const newArr = removeChunk(currentNote, currentChunkIndex)
		const newNote = Object.assign({}, state.notes[state.currentNote], {chunks: newArr})

		let chunks = Object.assign({}, state.chunks, {[upperChunkId] : newChunk})
		delete(chunks[chunkId])

		const notes = Object.assign({}, state.notes, {[state.currentNote] : newNote})
		const newState = Object.assign({}, state, {chunks: chunks}, {notes: notes}, {focus: upperChunkId})

		return newState
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
		default: {
			return state
		}
	}
	return state
}
