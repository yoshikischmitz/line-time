import {connect} from 'react-redux'
import DisplayChunk from '../components/DisplayChunk.js'
import { updateChunkState } from '../actions'

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onChange: (e) => {
			dispatch(updateChunkState(ownProps.id, e))
		}
	}
}

const mapStateToProps = (state, ownProps) => {
	const chunk = state.chunks[ownProps.id]
	return chunk
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayChunk)
