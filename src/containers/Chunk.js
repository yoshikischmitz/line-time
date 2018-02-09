import {connect} from 'react-redux'
import DisplayChunk from '../components/DisplayChunk.js'
import { updateChunkState, addChunk } from '../actions'
import {getDefaultKeyBinding} from 'draft-js';
const humanInterval = require('human-interval');

const TIME_BLOCK_REGEX = /^\[(.*)\]+/g;

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
		return {text: bracketText, seconds: interval}
	} else {
		return false
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onChange: (e) => {
			  dispatch(updateChunkState(ownProps.id, e))
		},
		beforeInput: (chars, state) => {
			if(chars === ' '){
				const text = getText(state)
				const interval = matchTime(text)
				if(interval){
			    dispatch(addChunk(ownProps.id, state, interval.text, interval.seconds/1000))
					return 'handled'
				} else {
					return 'not-handled'
				}
			} else {
				return 'not-handled'
			}
		}
	}
}

const mapStateToProps = (state, ownProps) => {
	const chunk = state.chunks[ownProps.id]
	return chunk
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayChunk)
