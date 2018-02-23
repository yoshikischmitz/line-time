import {
	EditorState, 
	Modifier, 
	SelectionState
} from 'draft-js'

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

function selectionAt(selection, key, offset){
	const opts = {hasFocus: true, anchorKey: key, focusKey: key, anchorOffset: offset, focusOffset: offset}
	return SelectionState.createEmpty(key).merge(opts)
}

export function moveToEnd(editorState){
	const content = editorState.getCurrentContent()
	const lastBlock = content.getLastBlock()
	const lastKey = lastBlock.getKey()
	const lastBlockLength = lastBlock.getLength()

	return EditorState.forceSelection(editorState, selectionAt(editorState.getSelection(), lastKey, lastBlockLength))
}

export function moveToStart(editorState){
	const content = editorState.getCurrentContent()
	const firstBlock = content.getFirstBlock()
	const firstKey = firstBlock.getKey()

	return EditorState.forceSelection(editorState, selectionAt(editorState.getSelection(), firstKey, 0))
}


export function mergeEditors(top, bottom){
	const mergedContent = appendBlocks(top.getCurrentContent(), bottom.getCurrentContent().getBlockMap())
  const mergedEditor = EditorState.push(top, mergedContent, "merge-up")
	const selection = bottom.getSelection()
	return EditorState.forceSelection(mergedEditor, selection)
}

export function splitEditor(editor, splitAnchor){
	const content = editor.getCurrentContent()
	const blocks = content.getBlockMap()
	const top = blocks.takeUntil(b => b.getKey() === splitAnchor)
	const bottom = blocks.skipUntil(b => b.getKey() === splitAnchor)

	return {top: top, bottom: bottom}
}

export function removeTextBeforeCursor(editor){
	const intervalRemovalSelection = editor.getSelection().merge({anchorOffset: 0})
	const contentWithoutText = Modifier.removeRange(editor.getCurrentContent(), intervalRemovalSelection, 'backward')
	return EditorState.push(editor, contentWithoutText, 'text-before-cursor-removed')
}

export const selectionCollapsed = (state) => {
	const selection = state.getSelection()
	const collapsed = (selection.getAnchorKey() === selection.getFocusKey()) && (selection.getAnchorOffset() === selection.getFocusOffset())
	return collapsed
}
