import {connect} from 'react-redux'
import React from 'react'
import CountDown from '../components/CountDown'
import Timer from '../containers/Timer'
import DisplayChunk from '../components/DisplayChunk.js'
import { 
	updateChunkState, 
	addChunk, 
	mergeChunkUp, 
	focus, 
	moveFocusUp, 
	moveFocusDown 
} from '../actions'
import {getDefaultKeyBinding} from 'draft-js';
import {
	selectionCollapsed
} from '../utils/draftUtils'
import {parseTime, findFirstIncompleteChunk} from '../utils'

const TIME_BLOCK_REGEX = /^\[(.*)\]/;

function getText(editorState){
	const contentState = editorState.getCurrentContent()
	const selection = editorState.getSelection()
	const anchorKey = selection.getAnchorKey()
	const currentContentBlock = contentState.getBlockForKey(anchorKey);
	return currentContentBlock.getText()
}

function matchTime(text){
	const matchArr = TIME_BLOCK_REGEX.exec(text)
	if(matchArr){
		const bracketText = matchArr[1]
		const interval = parseTime(bracketText)
		if(interval){
		  return {text: bracketText, seconds: interval}
		}
	}
  return false
}

function atStart(state){
	const selection = state.getSelection()
	if(selection.anchorOffset === 0){
		const blocks = state.getCurrentContent().getBlockMap()
		const index = blocks.keySeq().findIndex(k => k === selection.getAnchorKey())
		if(index === 0){
			return true
		}
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onChange: (e) => {
			 dispatch(updateChunkState(ownProps.id, e))
		},
		keyBindingFn: (e, state) => {
			if(e.keyCode === 32){
				const text = getText(state)
				const offset = state.getSelection().getStartOffset()
				const interval = matchTime(text)
				if(interval && offset === interval.text.length + 2){
					return 'space-after-interval'
				}
			} else if(e.keyCode === 8){
				if(atStart(state) && selectionCollapsed(state)){
					return 'backspace-at-start'
				}
			}
      return getDefaultKeyBinding(e);
		},
		onClick: () => {
			dispatch(focus(ownProps.id))
		},
		onKeyDown: (e, editorState) => {
			if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){
				const selection = editorState.getSelection()
				const content = editorState.getCurrentContent()

				const startKey = content.getFirstBlock().getKey()
				const endKey = content.getLastBlock().getKey()

				const anchorKey = selection.getAnchorKey()
				const focusKey = selection.getFocusKey()

				const anchorOffset = selection.getAnchorOffset()
				const focusOffset = selection.getFocusOffset()

				if(anchorKey != focusKey || anchorOffset != focusOffset){
					return 
				}

				const lastBlockLength = content.getLastBlock().getLength()

				if(anchorKey === startKey){
					if(e.key === 'ArrowUp' && anchorOffset === 0){
						e.preventDefault()
						dispatch(moveFocusUp())
					}
				} 
				if(anchorKey === endKey){
					if(e.key === 'ArrowDown' && (anchorOffset === lastBlockLength || lastBlockLength === 0)){
						e.preventDefault()
						dispatch(moveFocusDown())
					}
				}
			}
			if(e.key === 'Tab'){
				e.preventDefault()
			}
		},
		handleKeyCommand: (command, state) => {
			if(command === 'space-after-interval'){
				const text = getText(state)
				const interval = matchTime(text)
				if(interval){
			    dispatch(addChunk(ownProps.id, ownProps.noteId, state, interval.text, interval.seconds))
				  return 'handled'
				}
			} else if(command === 'backspace-at-start'){
				dispatch(mergeChunkUp(ownProps.id))
				return 'handled'
			}
			return 'not-handled'
		}
	}
}

const mapStateToProps = (state, ownProps) => {
	const chunk = state.chunks[ownProps.id]
	const focused = state.focus === ownProps.id

	const current = state.currentChunk === ownProps.id
	let countdown

	let controller
	if(current){
		countdown = <CountDown seconds={state.secondsRemaining} />
		controller = <Timer />
	}

	const firstIncomplete = findFirstIncompleteChunk(state) === ownProps.id

	if(!state.currentChunk && firstIncomplete && chunk.intervalSeconds > 0){
	  controller = <Timer />
	}

	return Object.assign({}, chunk, ownProps, {focused: focused, current: current, countdown: countdown, controller: controller})
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayChunk)
