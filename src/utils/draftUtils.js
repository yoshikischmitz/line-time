import {Modifier} from 'draft-js'
export function appendBlocks(content, appendedBlocks){
  return content.set('blockMap', content.getBlockMap().merge(appendedBlocks))
}

export const blocksToString = bs => bs.map(b => b.getText() ).join("\n")

export function insertTextAtCursor(editorState, text){
	const selection = editorState.getSelection()
	const content = editorState.getCurrentContent()
	return Modifier.insertText(content, selection, text)
}

export function blocksFromSelection(contentState, selection){
	const start = selection.getStartKey()
	const end = selection.getEndKey()
	const blocks = contentState.getBlockMap()

	// all the blocks from the start of the selection till the end
	const selectedBlocks = blocks
		.skipUntil(b => b.getKey() === start)
		.takeUntil(b => contentState.getKeyBefore(b.getKey()) === end)

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
export function selectTillEnd(editorState){
	const contentState = editorState.getCurrentContent()
	const lastBlock = contentState.getLastBlock()

	return editorState.getSelection().merge({
		anchorOffset: 0, 
		focusKey: lastBlock.getKey(), 
		focusOffset: lastBlock.getLength()
	})
}
