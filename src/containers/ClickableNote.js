import {connect} from 'react-redux'
import {changeNote} from '../actions'
import SidebarNote from '../components/SidebarNote'

const titleMax = 45
const previewMax = 40

function clip(text, max){
	if(text.length > max){
		return text.slice(0, max) + "..."
	} else {
		return text
	}
}

const mapStateToProps = (state, ownProps) => {
	const needHighlight = state.currentNote === ownProps.id

	const firstChunkId = state.notes[ownProps.id].chunks[0]
	const content = state.chunks[firstChunkId].editorState.getCurrentContent()

	const firstBlock = content.getFirstBlock()

	let title = firstBlock.getText()

	let contentPreview = ""

	if(title.length === 0){
		title = "Untitled"
	}

	if(title.length < titleMax){
		let currentBlock = firstBlock

		while((contentPreview.length < previewMax) && currentBlock != null){
			currentBlock = content.getBlockAfter(currentBlock.getKey())

			if(currentBlock){
				const text = currentBlock.getText()
				contentPreview += " " + text
			}
		}
	}

	return {
		title: clip(title, titleMax),
		contentPreview: clip(contentPreview, previewMax),
		highlight: needHighlight,
		time: state.notes[ownProps.id].updatedAt
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: () => {
			dispatch(changeNote(ownProps.id))
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(SidebarNote)
