import {connect} from 'react-redux'
import DisplayNote from '../components/DisplayNote'

const mapStateToProps = (state, ownProps) => {
	const chunks = state.notes[ownProps.id].chunks

	const renderChunks = chunks.map((id, index) => {
		let prevComplete
		if(index > 0){
			const lastChunk = chunks[index - 1]
		  prevComplete = state.chunks[lastChunk].complete
		}
		return {
			id: id,
			prevComplete: prevComplete
		}
	})

	return {chunks: renderChunks}
}

export default connect(mapStateToProps, null)(DisplayNote)
