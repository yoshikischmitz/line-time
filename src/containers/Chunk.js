import {connect} from 'react-redux'
import DisplayChunk from '../components/DisplayChunk.js'
import { updateChunkState, addChunk, mergeChunkUp } from '../actions'
import {getDefaultKeyBinding} from 'draft-js';
const humanInterval = require('human-interval');

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
		const interval = humanInterval(bracketText)
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
				const interval = matchTime(text)
				if(interval){
					return 'space-after-interval'
				}
			} else if(e.keyCode === 8){
				if(atStart(state)){
					return 'backspace-at-start'
				}
			}
      return getDefaultKeyBinding(e);
		},
		handleKeyCommand: (command, state) => {
			if(command === 'space-after-interval'){
				const text = getText(state)
				const interval = matchTime(text)
				if(interval){
			    dispatch(addChunk(ownProps.id, state, interval.text, interval.seconds/1000))
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
	return Object.assign({}, chunk, ownProps)
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayChunk)
