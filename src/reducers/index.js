import uuid from 'uuid'
import {EditorState, ContentState, Modifier, convertToRaw} from 'draft-js'
import {UpdateChunk, AddChunk} from '../actions/types'

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
			intervalContent: "25 minutes",
			intervalSeconds: 1500,
			editorState: EditorState.createEmpty()
		},
		[chunk2] : {
			intervalContent: "5 minutes",
			intervalSeconds: 300,
			editorState: EditorState.createEmpty()
		}
	}
}

function getSelectedText(contentState, selection){
  const startKey   = selection.getStartKey();
  const endKey     = selection.getEndKey();
  const blocks     = contentState.getBlockMap();

  let lastWasEnd = false;
	const selectedBlocks = 
		blocks.skipUntil((block) => {
			return block.getKey() === startKey;
		}).takeUntil((block) => {
	    const result = lastWasEnd;
			if (block.getKey() === endKey) {
			  lastWasEnd = true;
			}
			return result;
		});

	const getText = (block) => {
		const key = block.getKey();
		const text = block.getText();

		let start = 0;
		let end = text.length;

		if (key === startKey) {
				start = selection.getStartOffset();
		}
		if (key === endKey) {
				end = selection.getEndOffset();
		}
		return text.slice(start, end);
	}

	return selectedBlocks.map(getText).join("\n")
}

function clearTextBeforeCursor(editorState){
  const selection = editorState.getSelection()
	const removalSelection = selection.merge({anchorOffset: 0})
	return Modifier.removeRange(editorState.getCurrentContent(), removalSelection, 'backward')
}

// builds a selection starting from the end of the block before
// the current one till the end of the document
function selectTillEnd(editorState){
	const contentState = editorState.getCurrentContent()
	const lastBlock = contentState.getLastBlock()
	const selection = editorState.getSelection()
	const blockBefore = contentState.getKeyBefore(selection.getAnchorKey())

	let anchorKey
	let anchorOffset

	if(blockBefore){
		anchorKey = blockBefore
		anchorOffset = contentState.getBlockForKey(blockBefore).getLength()
	} else {
		anchorKey = selection.getAnchorKey()
		anchorOffset = 0
	}

	return selection.merge({
		anchorKey: anchorKey,
		anchorOffset: anchorOffset, 
		focusKey: lastBlock.getKey(), 
		focusOffset: lastBlock.getLength()
	})
}

function removeToEnd(editorState){
	const removalSelection = selectTillEnd(editorState)
	return Modifier.removeRange(editorState.getCurrentContent(), removalSelection, 'backward')
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
	const newChunkText = getSelectedText(currentContent, newChunkSelection)
	const newChunkContent = ContentState.createFromText(newChunkText)
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

	return Object.assign({}, state, {notes: notesUpdate, chunks: chunksUpdate})
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
		default: {
			return state
		}
	}
	return state
}
